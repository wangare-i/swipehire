locals {
  # Some Lambdas ended up with more than one integration object pointing at
  # them (an artifact of earlier debugging) — this map is faithful to that
  # reality rather than the "ideal" one-integration-per-function shape.
  integrations = {
    jobs           = "jobs"
    jobs_mine      = "jobs-mine"
    recruiters_a   = "recruiters" # in use: GET /recruiters
    recruiters_b   = "recruiters" # orphaned, no route targets this one
    candidates     = "candidates"
    swipes         = "swipes"
    matches_jobs_a = "matches-jobs" # GET /matches/jobs
    matches_jobs_b = "matches-jobs" # PATCH /matches/jobs
    matches        = "matches"
    messages       = "messages"
    posts_a        = "posts" # GET /posts
    posts_b        = "posts" # PATCH /posts
    posts_c        = "posts" # POST /posts
  }

  routes = {
    "GET /jobs"           = "jobs"
    "POST /jobs"          = "jobs"
    "GET /jobs/mine"      = "jobs_mine"
    "GET /recruiters"     = "recruiters_a"
    "GET /candidates"     = "candidates"
    "POST /swipes"        = "swipes"
    "GET /matches/jobs"   = "matches_jobs_a"
    "PATCH /matches/jobs" = "matches_jobs_b"
    "GET /matches"        = "matches"
    "GET /messages"       = "messages"
    "POST /messages"      = "messages"
    "GET /posts"          = "posts_a"
    "POST /posts"         = "posts_c"
    "PATCH /posts"        = "posts_b"
  }
}

resource "aws_apigatewayv2_integration" "app" {
  for_each = local.integrations

  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.app[each.value].arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "app" {
  for_each = local.routes

  api_id             = aws_apigatewayv2_api.main.id
  route_key          = each.key
  target             = "integrations/${aws_apigatewayv2_integration.app[each.value].id}"
  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.jwt.id
}
