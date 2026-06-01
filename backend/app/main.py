from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.routers import auth, customers, teams, invitations, activity, relations
from app.database import init_db

settings = get_settings()

# Initialize database tables on startup
init_db()

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    redirect_slashes=False,  # Disable 307 redirects to avoid stripping Authorization header
)

# Map common Pydantic error messages to Chinese
ERROR_MAP = {
    "Field required": "字段必填",
    "value is not a valid": "值无效",
    "String should have at least ": "字符串长度至少为",
    "String should have at most ": "字符串长度最多为",
    "Input should be a valid number": "输入应为有效数字",
    "Input should be greater than or equal to": "输入值应大于或等于",
    "Input should be less than or equal to": "输入值应小于或等于",
    "Input should be a valid integer": "输入应为有效整数",
    "Input should be 'true' or 'false'": "输入应为'true'或'false'",
    "URL should be absolute": "URL应为绝对地址",
    "Input should be a valid URL": "输入应为有效URL",
    "Input should be a valid email": "输入应为有效邮箱",
    "Input should be a valid datetime": "输入应为有效日期时间",
    "Value error, ": "值错误，",
}


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        msg = error.get("msg", "")
        # Translate common error messages
        translated = False
        for eng, chi in ERROR_MAP.items():
            if eng in msg:
                msg = msg.replace(eng, chi)
                translated = True
        # Clean up remaining English suffixes like " character", " bytes"
        msg = msg.replace(" character", " 个字符")
        msg = msg.replace(" bytes", " 字节")
        errors.append({
            "type": error.get("type", "validation_error"),
            "loc": error.get("loc", []),
            "msg": msg,
            "input": error.get("input"),
        })
    return JSONResponse(
        status_code=422,
        content={"detail": errors},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else [],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(customers.router, prefix="/api/v1")
app.include_router(teams.router, prefix="/api/v1")
app.include_router(invitations.router, prefix="/api/v1")
app.include_router(activity.router, prefix="/api/v1")
app.include_router(relations.router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {"status": "ok"}
