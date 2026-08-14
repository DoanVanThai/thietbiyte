UPDATE "User" AS user_record
SET "email" = replace(user_record."email", '@thienlocmedical.vn', '@thienlocgroup.com')
WHERE user_record."email" LIKE '%@thienlocmedical.vn'
  AND NOT EXISTS (
    SELECT 1
    FROM "User" AS canonical_user
    WHERE canonical_user."email" = replace(user_record."email", '@thienlocmedical.vn', '@thienlocgroup.com')
  );
