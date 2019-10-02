import {Injectable} from '@angular/core';
import * as XLSX from 'xlsx';

@Injectable()
export class ExcelService {

    constructor() {
    }

    static toExportFileName(excelFileName: string, pos:any = ''): string {
        return excelFileName ? `${excelFileName}_${pos}.xlsx` : `export_${new Date().getTime()}_${pos}.xlsx`;
    }

    public exportAsExcelFile(arraySheets: any[], excelFileName: string, abaUnica:boolean = true): void {
        if( !abaUnica ){
            arraySheets.forEach(
                (json, pos) => {
                    /* convert table 'table1' to worksheet named "Sheet1" */
                    // var ws1 = XLSX.utils.json_to_sheet(json);
                    // XLSX.utils.book_append_sheet(workbook, ws1, `ABA ${pos+1}`);
                    let worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
                    worksheet['A1'].s = ({ 'patternType': 'solid', 'fgColor': {'rgb': 'ff0000'}, 'bgColor': {'rgb': '0000ff'}});
                    let workbook: XLSX.WorkBook = {Sheets: {'data': worksheet}, SheetNames: [`data`]};
                    XLSX.writeFile( workbook, ExcelService.toExportFileName(excelFileName, pos+1) );
                }
            )


        }else{
            let json = arraySheets;
            const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
            worksheet['A1'].s = ({ 'patternType': 'solid', 'fgColor': {'rgb': 'ff0000'}, 'bgColor': {'rgb': '0000ff'}});
            const workbook: XLSX.WorkBook = {Sheets: {'data': worksheet}, SheetNames: ['data']};
            XLSX.writeFile(workbook, ExcelService.toExportFileName(excelFileName));
        }
    }
}