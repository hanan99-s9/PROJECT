 # Silent App Backend (PHP + MySQL)
 This backend is mainly built using PHP and MySQL, with additional use of Python for data processing.
## Requirements
- XAMPP (Apache + MySQL)
- PHP 8+

## Setup
1. Create DB: `silent_app`
2. Import tables (users, messages)
3. Put files in: `htdocs/silent_api/`
4. Run XAMPP: Apache + MySQL

## Endpoints
- POST /register.php
- POST /login.php
- (Protected) /save_message.php (requires X-API-TOKEN)
