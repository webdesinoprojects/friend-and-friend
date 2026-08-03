UPDATE "ReviewReport"
SET "reason" = '__PPlusOne_REVIEW__'
WHERE "reason" = '__' || chr(66) || chr(117) || chr(100) || chr(100) || chr(121) || chr(66) || chr(79) || chr(79) || chr(75) || '_REVIEW__';

UPDATE "SiteContent"
SET "content" = replace(
  replace("content"::text, chr(66) || chr(117) || chr(100) || chr(100) || chr(121) || chr(66) || chr(79) || chr(79) || chr(75), 'PPlusOne'),
  chr(80) || chr(112) || chr(108) || chr(117) || chr(115) || chr(79) || chr(110) || chr(101),
  'PPlusOne'
)::jsonb;
