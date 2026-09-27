locals {
  lambda_functions = {
    jobs = {
      env = {
        DYNAMODB_JOBS_TABLE     = "ajiraswipe-jobs"
        DYNAMODB_SWIPES_TABLE   = "ajiraswipe-swipes"
        DYNAMODB_PROFILES_TABLE = "ajiraswipe-profiles"
      }
    }
    jobs-mine = {
      env = {
        DYNAMODB_JOBS_TABLE = "ajiraswipe-jobs"
      }
    }
    recruiters = {
      env = {
        DYNAMODB_PROFILES_TABLE = "ajiraswipe-profiles"
        DYNAMODB_SWIPES_TABLE   = "ajiraswipe-swipes"
      }
    }
    candidates = {
      env = {
        DYNAMODB_PROFILES_TABLE = "ajiraswipe-profiles"
        DYNAMODB_SWIPES_TABLE   = "ajiraswipe-swipes"
      }
    }
    swipes = {
      env = {
        DYNAMODB_SWIPES_TABLE = "ajiraswipe-swipes"
      }
    }
    matches-jobs = {
      env = {
        DYNAMODB_JOBS_TABLE   = "ajiraswipe-jobs"
        DYNAMODB_SWIPES_TABLE = "ajiraswipe-swipes"
      }
    }
    matches = {
      env = {
        DYNAMODB_SWIPES_TABLE   = "ajiraswipe-swipes"
        DYNAMODB_PROFILES_TABLE = "ajiraswipe-profiles"
        DYNAMODB_MESSAGES_TABLE = "ajiraswipe-messages"
      }
    }
    messages = {
      env = {
        DYNAMODB_MESSAGES_TABLE = "ajiraswipe-messages"
      }
    }
    posts = {
      env = {
        DYNAMODB_POSTS_TABLE = "ajiraswipe-posts"
      }
    }
    pre-signup = {
      env = {}
    }
  }
}

data "archive_file" "lambda_zip" {
  for_each    = local.lambda_functions
  type        = "zip"
  source_file = "${path.module}/../lambda/${each.key}/index.mjs"
  output_path = "${path.module}/build/${each.key}.zip"
}

resource "aws_lambda_function" "app" {
  for_each = local.lambda_functions

  function_name = "ajiraswipe-${each.key}"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 128
  timeout       = 3
  architectures = ["x86_64"]

  filename         = data.archive_file.lambda_zip[each.key].output_path
  source_code_hash = data.archive_file.lambda_zip[each.key].output_base64sha256

  dynamic "environment" {
    for_each = length(each.value.env) > 0 ? [each.value.env] : []
    content {
      variables = environment.value
    }
  }
}

locals {
  # These 4 functions were only ever wired up via CLI (`aws lambda
  # add-permission` with a wildcard source-arn covering the whole API), so
  # they share one clean, uniform permission shape.
  apigw_wildcard_permission_functions = ["jobs-mine", "candidates", "matches", "messages"]
}

resource "aws_lambda_permission" "apigw" {
  for_each = toset(local.apigw_wildcard_permission_functions)

  statement_id  = "apigateway-invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:677078406463:${aws_apigatewayv2_api.main.id}/*/*/*"
}

# These 5 functions were touched via the console UI at some point (attaching
# an integration to a route through the console auto-generates a permission
# statement with a random Sid and a source-arn scoped to that one path,
# rather than the wildcard shape above). Describing that accurately, not
# "cleaning it up," is the point of this migration.
resource "aws_lambda_permission" "apigw_jobs" {
  statement_id  = "557e054e-e203-5eb8-8e74-3e3fdcf55068"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app["jobs"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:677078406463:${aws_apigatewayv2_api.main.id}/*/*/jobs"
}

resource "aws_lambda_permission" "apigw_swipes" {
  statement_id  = "970683a6-d12b-59ce-92b5-e2612fdea5f9"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app["swipes"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:677078406463:${aws_apigatewayv2_api.main.id}/*/*/swipes"
}

resource "aws_lambda_permission" "apigw_matches_jobs" {
  statement_id  = "460b2db6-744a-5b0f-a5f5-c0ea463ca07d"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app["matches-jobs"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:677078406463:${aws_apigatewayv2_api.main.id}/*/*/matches/jobs"
}

resource "aws_lambda_permission" "apigw_posts" {
  statement_id  = "5fc6cc15-012e-5a5c-b8f1-0ed8d3c2111c"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app["posts"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:677078406463:${aws_apigatewayv2_api.main.id}/*/*/posts"
}

# recruiters has *two* statements — one for the still-live /recruiters route,
# and one leftover from the retired /matches/recruiters route that was never
# cleaned up when that route was replaced. Both are still live in the
# resource policy, so both get imported.
resource "aws_lambda_permission" "apigw_recruiters_current" {
  statement_id  = "3e4a4984-27b5-5cd0-97e8-10b627a911b9"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app["recruiters"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:677078406463:${aws_apigatewayv2_api.main.id}/*/*/recruiters"
}

resource "aws_lambda_permission" "apigw_recruiters_stale" {
  statement_id  = "7d96a732-3563-5ed5-b8eb-497187143255"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app["recruiters"].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:677078406463:${aws_apigatewayv2_api.main.id}/*/*/matches/recruiters"
}

resource "aws_lambda_permission" "cognito_pre_signup" {
  statement_id  = "cognito-pre-signup-invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.app["pre-signup"].function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = aws_cognito_user_pool.main.arn
}
