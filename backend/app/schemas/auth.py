from pydantic import BaseModel


class LoginBody(BaseModel):
    usernameOrEmail: str | None = None
    password: str | None = None


class RegisterBody(BaseModel):
    username: str | None = None
    email: str | None = None
    password: str | None = None


class VerifyEmailBody(BaseModel):
    email: str | None = None
    code: str | None = None


class ResendVerificationBody(BaseModel):
    email: str | None = None


class UpdateProfileImageBody(BaseModel):
    profileImage: str | None = None


class ChangePasswordBody(BaseModel):
    currentPassword: str | None = None
    newPassword: str | None = None
