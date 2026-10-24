# Lets GitHub Actions authenticate to AWS with short-lived, per-run
# credentials instead of a long-lived access key sitting in GitHub Secrets.
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

# Trusted *only* by workflow runs on this exact repo — any other repo's
# Actions runs (even in the same GitHub org) cannot assume this role.
resource "aws_iam_role" "github_actions_deploy" {
  name = "ajiraswipe-github-actions-deploy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Federated = aws_iam_openid_connect_provider.github.arn }
        Action    = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:wangare-i/swipehire:*"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "deploy_dynamodb" {
  role       = aws_iam_role.github_actions_deploy.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

resource "aws_iam_role_policy_attachment" "deploy_lambda" {
  role       = aws_iam_role.github_actions_deploy.name
  policy_arn = "arn:aws:iam::aws:policy/AWSLambda_FullAccess"
}

resource "aws_iam_role_policy_attachment" "deploy_apigateway" {
  role       = aws_iam_role.github_actions_deploy.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator"
}

resource "aws_iam_role_policy_attachment" "deploy_cognito" {
  role       = aws_iam_role.github_actions_deploy.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonCognitoPowerUser"
}

# The managed policies above don't cover IAM itself — Terraform needs to be
# able to read/attach-to the Lambda execution role. Scoped to that one role
# only, not IAM in general.
resource "aws_iam_role_policy" "deploy_iam_scoped" {
  name = "manage-lambda-exec-role"
  role = aws_iam_role.github_actions_deploy.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:CreateRole",
          "iam:DeleteRole",
          "iam:PassRole",
          "iam:TagRole",
          "iam:PutRolePolicy",
          "iam:GetRolePolicy",
          "iam:DeleteRolePolicy",
          "iam:AttachRolePolicy",
          "iam:DetachRolePolicy",
          "iam:ListAttachedRolePolicies",
          "iam:ListRolePolicies",
        ]
        Resource = "arn:aws:iam::677078406463:role/ajiraswipe-lambda-role"
      },
      {
        Effect   = "Allow"
        Action   = "iam:ListOpenIDConnectProviders"
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = ["iam:GetOpenIDConnectProvider"]
        Resource = aws_iam_openid_connect_provider.github.arn
      },
      {
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:PassRole",
        ]
        Resource = aws_iam_role.github_actions_deploy.arn
      }
    ]
  })
}
