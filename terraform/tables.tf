resource "aws_dynamodb_table" "jobs" {
  name         = "ajiraswipe-jobs"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "recruiters" {
  name         = "ajiraswipe-recruiters"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "posts" {
  name         = "ajiraswipe-posts"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "swipes" {
  name         = "ajiraswipe-swipes"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "targetId"
    type = "S"
  }

  global_secondary_index {
    name            = "userId-targetId-index"
    hash_key        = "userId"
    range_key       = "targetId"
    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "messages" {
  name         = "ajiraswipe-messages"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "matchId"
  range_key    = "createdAt"

  attribute {
    name = "matchId"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }
}
