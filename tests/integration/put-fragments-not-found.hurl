# tests/integration/put-fragments-not-found.hurl
# Test that PUT to non-existent fragment returns 404

PUT http://localhost:8080/v1/fragments/00000000-0000-0000-0000-000000000000

Content-Type: text/plain

[BasicAuth]
user1@email.com:password1

`Updated data`

HTTP/1.1 404

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "Fragment not found"


