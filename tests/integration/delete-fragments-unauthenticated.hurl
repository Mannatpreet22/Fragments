# tests/integration/delete-fragments-unauthenticated.hurl
# Unauthenticated DELETE requests should be denied

# 1. First, create a fragment as an authenticated user
POST http://localhost:8080/v1/fragments

Content-Type: text/plain

[BasicAuth]
user1@email.com:password1

`Fragment for unauthorized delete test`

HTTP/1.1 201

[Asserts]
jsonpath "$.status" == "ok"

[Captures]
fragment_url: header "Location"

# 2. Try to delete without authentication
DELETE {{fragment_url}}

HTTP/1.1 401

[Asserts]
# http-auth library returns plain text "Unauthorized" for 401
body == "Unauthorized"

# 3. Try to delete with incorrect credentials
DELETE {{fragment_url}}

[BasicAuth]
user1@email.com:wrong_password

HTTP/1.1 401

[Asserts]
body == "Unauthorized"

