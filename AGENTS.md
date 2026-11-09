# Architecture rules

- Camp registration loading uses a shared status component and request-scoped progress hook; completion is reported only after registrations and required attendance data finish, so partial totals are never labelled complete.- Portal tab delegation lives in the staff_tab_access table (staff rule > department rule > role defaults); tabs from another portal use the id "PORTAL:tabId" and RoleBasedPortal renders the owning portal, so delegation reuses existing screens instead of duplicating them.
- Camp form CMS entries use `${campType}-form` slugs; missing seasonal entries remain editable from defaults and persist through the existing content_items upsert so public routes retain their camp-type mapping.
