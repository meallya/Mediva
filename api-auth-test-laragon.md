use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/_
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
|
_/
Route::middleware('web')->group(function () {
Route::post('/auth/login', [AuthController::class, 'login']);

/_
|--------------------------------------------------------------------------
| AUTHENTICATED ROUTES
|--------------------------------------------------------------------------
_/
Route::middleware('auth:sanctum')->group(function () {

/_
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
_/
Route::get('/auth/me', [AuthController::class, 'me']);
Route::post('/auth/switch-role', [AuthController::class, 'switchRole']);
Route::post('/auth/logout', [AuthController::class, 'logout']);
});

});

Di .env nanti APP_URL ubah jadi : APP_URL=http://mediva.test
terus cari/tambahin : SANCTUM_STATEFUL_DOMAINS=mediva.test,localhost,localhost:5173,127.0.0.1,127.0.0.1:8000

isi .env nya :
APP_NAME=Mediva
APP_ENV=local
APP_DEBUG=true
APP_URL=http://mediva.test

SESSION_DRIVER=file
SESSION_LIFETIME=120
SESSION_DOMAIN=

SANCTUM_STATEFUL_DOMAINS=mediva.test,localhost,localhost:5173,127.0.0.1,127.0.0.1:8000
