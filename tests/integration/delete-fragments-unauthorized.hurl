# tests/integration/delete-fragments-unauthorized.hurl
# DELETE requests for fragments belonging to other users should return 404

# 1. Create a fragment as user1
POST http://localhost:8080/v1/fragments

Content-Type: text/plain

[BasicAuth]
user1@email.com:password1

`Fragment owned by user1`

HTTP/1.1 201

[Asserts]
jsonpath "$.status" == "ok"

[Captures]
fragment_url: header "Location"
fragment_id: jsonpath "$.fragment.id"

# 2. Try to delete it as user2 (should fail)
DELETE {{fragment_url}}

[BasicAuth]
user2@email.com:password2

HTTP/1.1 404

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "Fragment not found"

# 3. Verify user1 can still access it (fragment should not be deleted)
# Use GET /v1/fragments/:id/info to get metadata as JSON
GET {{fragment_url}}/info

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.id" == "{{fragment_id}}"

