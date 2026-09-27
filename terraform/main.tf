terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }
}

provider "aws" {
  region = "eu-west-2"
}
resource "aws_dynamodb_table" "profiles" {
  name         = "ajiraswipe-profiles"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }
}
resource "aws_cognito_user_pool" "main" {
  name = "User pool - wya5tq"

  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
  mfa_configuration        = "OFF"
  deletion_protection      = "ACTIVE"

  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_uppercase                = true
    require_numbers                  = true
    require_symbols                  = true
    temporary_password_validity_days = 7
  }

  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  schema {
    name                     = "email"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    required                 = true

    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  schema {
    name                     = "name"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    required                 = true

    string_attribute_constraints {
      min_length = 0
      max_length = 2048
    }
  }

  schema {
    name                     = "role"
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    required                 = false

    string_attribute_constraints {
      min_length = 1
      max_length = 20
    }
  }

  lambda_config {
    pre_sign_up = "arn:aws:lambda:eu-west-2:677078406463:function:ajiraswipe-pre-signup"
  }
}

resource "aws_cognito_user_pool_client" "web_public" {
  name         = "ajiraswipe-web-public"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = false

  explicit_auth_flows = [
    "ALLOW_USER_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ]

  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "phone"]
  supported_identity_providers         = ["COGNITO"]
  callback_urls                        = ["https://d84l1y8p4kdic.cloudfront.net"]

  access_token_validity  = 60
  id_token_validity      = 60
  refresh_token_validity = 5

  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  lifecycle {
    ignore_changes = [generate_secret]
  }
}

resource "aws_iam_role" "lambda_exec" {
  name        = "ajiraswipe-lambda-role"
  description = "Allows Lambda functions to call AWS services on your behalf."

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Effect    = "Allow"
        Principal = { Service = "lambda.amazonaws.com" }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

data "archive_file" "profile_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambda/profile/index.mjs"
  output_path = "${path.module}/build/profile.zip"
}

resource "aws_lambda_function" "profile" {
  function_name = "ajiraswipe-profile"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 128
  timeout       = 3
  architectures = ["x86_64"]

  filename         = data.archive_file.profile_zip.output_path
  source_code_hash = data.archive_file.profile_zip.output_base64sha256

  environment {
    variables = {
      DYNAMODB_PROFILES_TABLE = "ajiraswipe-profiles"
    }
  }
}

resource "aws_lambda_permission" "profile_apigw" {
  statement_id  = "apigateway-invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.profile.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:677078406463:${aws_apigatewayv2_api.main.id}/*/*/*"
}

resource "aws_apigatewayv2_api" "main" {
  name          = "ajiraswipejobs-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["http://localhost:3000"]
    allow_methods = ["GET", "POST", "PATCH", "PUT", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
    max_age       = 300
  }
}

resource "aws_apigatewayv2_authorizer" "jwt" {
  api_id           = aws_apigatewayv2_api.main.id
  authorizer_type  = "JWT"
  identity_sources = ["$request.header.Authorization"]
  name             = "ajiraswipe-cognito-authorizer"

  jwt_configuration {
    audience = [aws_cognito_user_pool_client.web_public.id]
    issuer   = "https://cognito-idp.eu-west-2.amazonaws.com/${aws_cognito_user_pool.main.id}"
  }
}

resource "aws_apigatewayv2_integration" "profile" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.profile.arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_profile" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "GET /profile"
  target             = "integrations/${aws_apigatewayv2_integration.profile.id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}
