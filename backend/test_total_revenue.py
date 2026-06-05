import asyncio
import os
import sys
# Ensure environment variables won't break Settings validation
os.environ.setdefault('DEBUG', 'False')
os.environ.setdefault('MONGODB_URL', 'mongodb://localhost:27017')
os.environ.setdefault('DATABASE_NAME', 'ecommerce_analytics')

sys.path.insert(0, os.getcwd())
from app.services import sql_engine_service

async def test():
    q = "What is total revenue?"
    sql, chart = await sql_engine_service.generate_sql_and_chart_type(q, 'test-session')
    print('SQL:', sql)
    print('Chart:', chart)
    res = await sql_engine_service.execute_analysis_query(sql, 'test-session')
    print('Result rows:', res['rows'])

if __name__ == '__main__':
    asyncio.run(test())
