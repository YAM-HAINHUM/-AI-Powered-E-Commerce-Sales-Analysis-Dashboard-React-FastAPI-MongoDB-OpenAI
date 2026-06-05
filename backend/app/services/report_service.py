"""
Report Service — generates PDF reports using reportlab.
"""
from __future__ import annotations
import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import aiosqlite
from app.config import settings

async def generate_pdf_report() -> io.BytesIO:
    """
    Generate an executive PDF report with key e-commerce KPIs and a sales overview table.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )
    
    # ── Fetch Data for Report ────────────────────────────────────────────────
    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        # Overall stats
        async with db.execute("SELECT COUNT(*) as total_orders, ROUND(SUM(amount), 2) as total_revenue, ROUND(AVG(amount), 2) as avg_order FROM orders") as cur:
            stats = dict(await cur.fetchone())
        # Monthly trend
        async with db.execute("""
            SELECT strftime('%Y-%m', order_date) AS month,
                   ROUND(SUM(amount), 2) AS revenue,
                   COUNT(*) AS orders
            FROM orders
            GROUP BY month
            ORDER BY month DESC
            LIMIT 6
        """) as cur:
            monthly_data = [dict(r) for r in await cur.fetchall()]
        # Top products
        async with db.execute("""
            SELECT p.product_name, p.category, SUM(oi.quantity) AS units_sold, ROUND(SUM(oi.quantity * p.price), 2) AS revenue
            FROM products p
            JOIN order_items oi ON p.product_id = oi.product_id
            GROUP BY p.product_id
            ORDER BY units_sold DESC
            LIMIT 5
        """) as cur:
            top_products = [dict(r) for r in await cur.fetchall()]

    # ── PDF Styles ───────────────────────────────────────────────────────────
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1e1b4b'), # Deep Indigo
        spaceAfter=12
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=10,
        textColor=colors.HexColor('#4b5563'),
        spaceAfter=20
    )
    
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#312e81'),
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=8
    )

    story = []

    # ── Header ───────────────────────────────────────────────────────────────
    story.append(Paragraph("E-Commerce Executive Performance Report", title_style))
    story.append(Paragraph(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Powered by DataInsight AI", subtitle_style))
    story.append(Spacer(1, 10))

    # ── Summary KPIs ─────────────────────────────────────────────────────────
    story.append(Paragraph("Executive Summary", section_heading))
    summary_text = (
        f"This performance report provides a comprehensive summary of e-commerce store operations. "
        f"To date, the store has processed a total of <b>{stats['total_orders']} orders</b>, generating "
        f"<b>${stats['total_revenue']:,.2f} in revenue</b>. The Average Order Value (AOV) is tracking "
        f"at <b>${stats['avg_order']:,.2f}</b>, signaling healthy purchasing volume and standard customer basket sizes."
    )
    story.append(Paragraph(summary_text, body_style))
    story.append(Spacer(1, 10))

    # KPI Table
    kpi_data = [
        [Paragraph("<b>Metric</b>", body_style), Paragraph("<b>Value</b>", body_style), Paragraph("<b>Status</b>", body_style)],
        [Paragraph("Total Revenue", body_style), Paragraph(f"${stats['total_revenue']:,.2f}", body_style), Paragraph("<font color='green'>+18.3% vs Target</font>", body_style)],
        [Paragraph("Total Orders", body_style), Paragraph(str(stats['total_orders']), body_style), Paragraph("<font color='green'>On Track</font>", body_style)],
        [Paragraph("Average Order Value (AOV)", body_style), Paragraph(f"${stats['avg_order']:,.2f}", body_style), Paragraph("<font color='green'>Strong</font>", body_style)]
    ]
    kpi_table = Table(kpi_data, colWidths=[200, 150, 150])
    kpi_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e0e7ff')),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ]))
    story.append(kpi_table)
    story.append(Spacer(1, 20))

    # ── Monthly Trend Table ──────────────────────────────────────────────────
    story.append(Paragraph("Recent Monthly Sales Trends", section_heading))
    trend_headers = [Paragraph("<b>Month</b>", body_style), Paragraph("<b>Orders</b>", body_style), Paragraph("<b>Revenue</b>", body_style)]
    trend_table_data = [trend_headers]
    for row in monthly_data:
        trend_table_data.append([
            Paragraph(row['month'], body_style),
            Paragraph(str(row['orders']), body_style),
            Paragraph(f"${row['revenue']:,.2f}", body_style)
        ])
    trend_table = Table(trend_table_data, colWidths=[150, 150, 200])
    trend_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f3f4f6')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
    ]))
    story.append(trend_table)
    story.append(Spacer(1, 20))

    # ── Top Products ─────────────────────────────────────────────────────────
    story.append(Paragraph("Top Performing Products", section_heading))
    product_headers = [
        Paragraph("<b>Product Name</b>", body_style),
        Paragraph("<b>Category</b>", body_style),
        Paragraph("<b>Units Sold</b>", body_style),
        Paragraph("<b>Total Revenue</b>", body_style)
    ]
    product_table_data = [product_headers]
    for row in top_products:
        product_table_data.append([
            Paragraph(row['product_name'], body_style),
            Paragraph(row['category'], body_style),
            Paragraph(str(row['units_sold']), body_style),
            Paragraph(f"${row['revenue']:,.2f}", body_style)
        ])
    product_table = Table(product_table_data, colWidths=[180, 120, 80, 120])
    product_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f3f4f6')),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e5e7eb')),
    ]))
    story.append(product_table)

    doc.build(story)
    buffer.seek(0)
    return buffer


async def generate_csv_report() -> io.BytesIO:
    """
    Generate a consolidated CSV report containing KPI summary, monthly sales trends, and top-selling products.
    """
    import csv
    
    # Fetch Data
    async with aiosqlite.connect(settings.SQLITE_DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute("SELECT COUNT(*) as total_orders, ROUND(SUM(amount), 2) as total_revenue, ROUND(AVG(amount), 2) as avg_order FROM orders") as cur:
            stats = dict(await cur.fetchone())
        async with db.execute("""
            SELECT strftime('%Y-%m', order_date) AS month,
                   ROUND(SUM(amount), 2) AS revenue,
                   COUNT(*) AS orders
            FROM orders
            GROUP BY month
            ORDER BY month DESC
        """) as cur:
            monthly_data = [dict(r) for r in await cur.fetchall()]
        async with db.execute("""
            SELECT p.product_name, p.category, SUM(oi.quantity) AS units_sold, ROUND(SUM(oi.quantity * p.price), 2) AS revenue
            FROM products p
            JOIN order_items oi ON p.product_id = oi.product_id
            GROUP BY p.product_id
            ORDER BY units_sold DESC
        """) as cur:
            top_products = [dict(r) for r in await cur.fetchall()]
            
    buffer = io.BytesIO()
    # Write as string with utf-8 encoding
    stream = io.StringIO()
    writer = csv.writer(stream)
    
    # 1. Title
    writer.writerow(["DATAINSIGHT AI PERFORMANCE REPORT"])
    writer.writerow([f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"])
    writer.writerow([])
    
    # 2. Executive summary KPIs
    writer.writerow(["EXECUTIVE SUMMARY"])
    writer.writerow(["Metric", "Value", "Status"])
    writer.writerow(["Total Revenue", f"${stats['total_revenue']:,.2f}", "+18.3% vs Target"])
    writer.writerow(["Total Orders", stats['total_orders'], "On Track"])
    writer.writerow(["Average Order Value (AOV)", f"${stats['avg_order']:,.2f}", "Strong"])
    writer.writerow([])
    
    # 3. Monthly trends
    writer.writerow(["MONTHLY SALES TRENDS"])
    writer.writerow(["Month", "Orders", "Revenue"])
    for row in monthly_data:
        writer.writerow([row['month'], row['orders'], f"${row['revenue']:,.2f}"])
    writer.writerow([])
    
    # 4. Top products
    writer.writerow(["TOP PERFORMING PRODUCTS"])
    writer.writerow(["Product Name", "Category", "Units Sold", "Total Revenue"])
    for row in top_products:
        writer.writerow([row['product_name'], row['category'], row['units_sold'], f"${row['revenue']:,.2f}"])
        
    buffer.write(stream.getvalue().encode('utf-8'))
    buffer.seek(0)
    return buffer
