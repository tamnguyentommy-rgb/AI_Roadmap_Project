import os
import httpx
import secrets
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.core.auth import hash_password, verify_password, create_access_token

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID", "")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET", "")

def get_frontend_base():
    dev_domain = os.getenv("REPLIT_DEV_DOMAIN", "")
    if dev_domain:
        return f"https://{dev_domain}"
    return "http://localhost:5000"

def get_backend_base():
    dev_domain = os.getenv("REPLIT_DEV_DOMAIN", "")
    if dev_domain:
        return f"https://{dev_domain}"
    return "http://localhost:8000"


@router.get("/check-username")
def check_username(username: str = Query(...), db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == username).first()
    return {"available": existing is None}


@router.post("/signup", response_model=Token)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    if len(user_data.username) < 3 or len(user_data.username) > 30:
        raise HTTPException(status_code=400, detail="Tên đăng nhập phải từ 3–30 ký tự!")
    if not all(c.isalnum() or c == '_' for c in user_data.username):
        raise HTTPException(status_code=400, detail="Tên đăng nhập chỉ gồm chữ, số và dấu gạch dưới!")
    if len(user_data.password) < 8:
        raise HTTPException(status_code=400, detail="Mật khẩu phải có ít nhất 8 ký tự!")

    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tên đăng nhập đã tồn tại!")

    if user_data.email:
        email_user = db.query(User).filter(User.email == user_data.email).first()
        if email_user:
            raise HTTPException(status_code=400, detail="Email này đã được dùng!")

    new_user = User(
        username=user_data.username,
        password_hash=hash_password(user_data.password),
        email=user_data.email if user_data.email else None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "username": new_user.username})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    login_field = user_data.login_field.strip()
    is_email = "@" in login_field

    if is_email:
        user = db.query(User).filter(User.email == login_field).first()
    else:
        user = db.query(User).filter(User.username == login_field).first()

    if not user or not user.password_hash or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Sai thông tin đăng nhập!")

    token = create_access_token({"sub": str(user.id), "username": user.username})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/google")
def google_login():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google OAuth chưa được cấu hình!")
    backend_base = get_backend_base()
    redirect_uri = f"{backend_base}/api/auth/google/callback"
    scope = "openid email profile"
    state = secrets.token_urlsafe(16)
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&response_type=code"
        f"&scope={scope}"
        f"&state={state}"
        f"&access_type=offline"
    )
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(code: str = Query(...), db: Session = Depends(get_db)):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Google OAuth chưa được cấu hình!")
    backend_base = get_backend_base()
    redirect_uri = f"{backend_base}/api/auth/google/callback"
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Lỗi xác thực Google!")
        access_token = token_resp.json().get("access_token")
        user_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Không lấy được thông tin người dùng từ Google!")
        guser = user_resp.json()

    google_id = guser.get("id")
    email = guser.get("email")
    name = guser.get("name", "")

    user = db.query(User).filter(User.oauth_provider == "google", User.oauth_id == google_id).first()
    if not user and email:
        user = db.query(User).filter(User.email == email).first()

    if not user:
        base_username = (email.split("@")[0] if email else name.replace(" ", "_").lower())[:20]
        username = base_username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}_{counter}"
            counter += 1
        user = User(
            username=username,
            email=email,
            oauth_provider="google",
            oauth_id=google_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if not user.oauth_provider:
            user.oauth_provider = "google"
            user.oauth_id = google_id
            db.commit()
            db.refresh(user)

    jwt_token = create_access_token({"sub": str(user.id), "username": user.username})
    frontend_base = get_frontend_base()
    return RedirectResponse(f"{frontend_base}/oauth-callback?token={jwt_token}&user_id={user.id}")


@router.get("/facebook")
def facebook_login():
    if not FACEBOOK_APP_ID:
        raise HTTPException(status_code=503, detail="Facebook OAuth chưa được cấu hình!")
    backend_base = get_backend_base()
    redirect_uri = f"{backend_base}/api/auth/facebook/callback"
    state = secrets.token_urlsafe(16)
    url = (
        f"https://www.facebook.com/v18.0/dialog/oauth"
        f"?client_id={FACEBOOK_APP_ID}"
        f"&redirect_uri={redirect_uri}"
        f"&scope=email,public_profile"
        f"&state={state}"
    )
    return RedirectResponse(url)


@router.get("/facebook/callback")
async def facebook_callback(code: str = Query(...), db: Session = Depends(get_db)):
    if not FACEBOOK_APP_ID or not FACEBOOK_APP_SECRET:
        raise HTTPException(status_code=503, detail="Facebook OAuth chưa được cấu hình!")
    backend_base = get_backend_base()
    redirect_uri = f"{backend_base}/api/auth/facebook/callback"
    async with httpx.AsyncClient() as client:
        token_resp = await client.get(
            "https://graph.facebook.com/v18.0/oauth/access_token",
            params={
                "client_id": FACEBOOK_APP_ID,
                "client_secret": FACEBOOK_APP_SECRET,
                "redirect_uri": redirect_uri,
                "code": code,
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Lỗi xác thực Facebook!")
        access_token = token_resp.json().get("access_token")
        user_resp = await client.get(
            "https://graph.facebook.com/me",
            params={"fields": "id,name,email", "access_token": access_token},
        )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Không lấy được thông tin người dùng từ Facebook!")
        fbuser = user_resp.json()

    fb_id = fbuser.get("id")
    email = fbuser.get("email")
    name = fbuser.get("name", "")

    user = db.query(User).filter(User.oauth_provider == "facebook", User.oauth_id == fb_id).first()
    if not user and email:
        user = db.query(User).filter(User.email == email).first()

    if not user:
        base_username = (email.split("@")[0] if email else name.replace(" ", "_").lower())[:20]
        username = base_username
        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username}_{counter}"
            counter += 1
        user = User(
            username=username,
            email=email,
            oauth_provider="facebook",
            oauth_id=fb_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        if not user.oauth_provider:
            user.oauth_provider = "facebook"
            user.oauth_id = fb_id
            db.commit()
            db.refresh(user)

    jwt_token = create_access_token({"sub": str(user.id), "username": user.username})
    frontend_base = get_frontend_base()
    return RedirectResponse(f"{frontend_base}/oauth-callback?token={jwt_token}&user_id={user.id}")
