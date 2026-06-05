"""
Reports Routes.
Provides routes to download executive PDF and CSV reports.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.middleware.auth import get_current_user
from app.services.report_service import generate_pdf_report, generate_csv_report

router = APIRouter(prefix="/api/report", tags=["report"])

@router.get("/download")
async def download_report(_: dict = Depends(get_current_user)):
    """Generate and download PDF sales report."""
    pdf_buffer = await generate_pdf_report()
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=ecommerce_executive_report.pdf"}
    )

@router.get("/download-excel")
async def download_excel(_: dict = Depends(get_current_user)):
    """Generate and download CSV consolidated report (usable in Excel)."""
    csv_buffer = await generate_csv_report()
    return StreamingResponse(
        csv_buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ecommerce_executive_report.csv"}
    )
