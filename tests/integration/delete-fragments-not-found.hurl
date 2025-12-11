# tests/integration/delete-fragments-not-found.hurl
# DELETE requests for non-existent fragments should return 404

# Try to delete a non-existent fragment
DELETE http://localhost:8080/v1/fragments/non-existent-id-12345

[BasicAuth]
user1@email.com:password1

HTTP/1.1 404

[Asserts]
jsonpath "$.status" == "error"
jsonpath "$.error.code" == 404
jsonpath "$.error.message" == "Fragment not found"

