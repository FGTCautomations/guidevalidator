@echo off
echo Applying cursor fix to Supabase...
curl -X POST "https://vhqzmunorymtoisijiqb.supabase.co/rest/v1/rpc/exec_sql" ^
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MzM0MTIsImV4cCI6MjA1MzAwOTQxMn0.iUQ4-iEcaXd7rLvDnc5_y-_OqWxcuIALtdg3xh0wH3w" ^
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0MzM0MTIsImV4cCI6MjA1MzAwOTQxMn0.iUQ4-iEcaXd7rLvDnc5_y-_OqWxcuIALtdg3xh0wH3w" ^
  -H "Content-Type: application/json" ^
  -d "@fix_cursor_working.sql"
echo.
echo Done!
pause
