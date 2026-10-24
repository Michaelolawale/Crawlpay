import { NextResponse } from 'next/server';
import exampleReportData from '@/data/exampleReport.json';

export async function GET() {
  return NextResponse.json(exampleReportData);
}
