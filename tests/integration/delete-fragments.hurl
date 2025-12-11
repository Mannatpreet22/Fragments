# tests/integration/delete-fragments.hurl
# Authenticated DELETE to /v1/fragments/:id

# 1. First, create a fragment to delete
POST http://localhost:8080/v1/fragments

Content-Type: text/plain

[BasicAuth]
user1@email.com:password1

`Fragment to be deleted`

HTTP/1.1 201

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.fragment.type" == "text/plain"

[Captures]
fragment_url: header "Location"
fragment_id: jsonpath "$.fragment.id"

# 2. Delete the fragment
DELETE {{fragment_url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"
jsonpath "$.message" == "Fragment deleted successfully"

# 3. Verify the fragment is deleted by trying to get it
GET {{fragment_url}}

[BasicAuth]
user1@email.com:password1

HTTP/1.1 404

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "Fragment not found"

# 4. Verify the fragment is not in the list
GET http://localhost:8080/v1/fragments

[BasicAuth]
user1@email.com:password1

HTTP/1.1 200

[Asserts]
jsonpath "$.status" == "ok"
# Verify the deleted fragment ID is not in the list
jsonpath "$.fragments[*].id" not contains {{fragment_id}}

