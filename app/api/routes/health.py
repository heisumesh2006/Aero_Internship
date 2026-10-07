from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health", summary="Check service availability")
def health() -> dict[str, str]:
    return {"status": "ok"}
