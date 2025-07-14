@echo off

REM Run this script from the project root


SET CONNECTION_STRING=Server=tcp:miss-issippi.database.windows.net,1433;Initial Catalog=Miss_Issippi_DB-Dev;Persist Security Info=False;User ID=miss_issippi_admin;Password=Frills101;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
SET MODELS_FOLDER=Models
SET CONTEXT_FOLDER=Data
SET CONTEXT_NAME=MissIssippiContext

echo Scaffolding from database using context name: %CONTEXT_NAME%

dotnet ef dbcontext scaffold "%CONNECTION_STRING%" Microsoft.EntityFrameworkCore.SqlServer ^
 -o %MODELS_FOLDER% ^
 --context-dir %CONTEXT_FOLDER% ^
 --context %CONTEXT_NAME% ^
 -f

echo ✅ Scaffolding complete.
echo Models saved in: %MODELS_FOLDER%
echo DbContext saved in: %CONTEXT_FOLDER%\%CONTEXT_NAME%.cs