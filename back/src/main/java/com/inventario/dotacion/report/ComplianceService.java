package com.inventario.dotacion.report;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.inventario.dotacion.common.security.DataPrivacyService;
import com.inventario.dotacion.delivery.DeliveryItemRepository;
import com.inventario.dotacion.delivery.DeliveryRepository;
import com.inventario.dotacion.delivery.LastDeliverySnapshot;
import com.inventario.dotacion.employee.Employee;
import com.inventario.dotacion.employee.EmployeeRepository;
import com.inventario.dotacion.report.dto.ComplianceRowResponse;
import com.inventario.dotacion.report.dto.DashboardSummaryResponse;
import com.inventario.dotacion.requirement.EmployeeRequirement;
import com.inventario.dotacion.requirement.EmployeeRequirementRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ComplianceService {

    private static final DateTimeFormatter EXCEL_DATE_TIME_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final EmployeeRepository employeeRepository;
    private final EmployeeRequirementRepository requirementRepository;
    private final DeliveryItemRepository deliveryItemRepository;
    private final DeliveryRepository deliveryRepository;
    private final DataPrivacyService dataPrivacyService;

    @Transactional(readOnly = true)
    public List<ComplianceRowResponse> getComplianceRows(ComplianceStatus filter, boolean includeSensitiveData) {
        List<Employee> employees = employeeRepository.findByActiveTrueOrderByLastNameAscFirstNameAsc();
        if (employees.isEmpty()) {
            return List.of();
        }

        List<UUID> employeeIds = employees.stream().map(Employee::getId).toList();
        List<EmployeeRequirement> requirements = requirementRepository.findByEmployeeIdIn(employeeIds);

        Map<UUID, List<EmployeeRequirement>> requirementsByEmployee = requirements.stream()
                .collect(Collectors.groupingBy(requirement -> requirement.getEmployee().getId()));

        Map<String, LocalDate> latestDeliveriesByEmployeeAndItem = buildLatestDeliveryMap(employeeIds);

        LocalDate today = LocalDate.now();
        List<ComplianceRowResponse> rows = new ArrayList<>();

        for (Employee employee : employees) {
            List<EmployeeRequirement> employeeRequirements = requirementsByEmployee.getOrDefault(employee.getId(), List.of());

            int totalRequirements = employeeRequirements.size();
            int pendingRequirements = 0;
            LocalDate nextDueDate = null;
            List<String> pendingItems = new ArrayList<>();

            for (EmployeeRequirement requirement : employeeRequirements) {
                String key = buildKey(employee.getId(), requirement.getItemType().getId());
                LocalDate lastDeliveryDate = latestDeliveriesByEmployeeAndItem.get(key);

                LocalDate dueDate = lastDeliveryDate != null
                        ? lastDeliveryDate.plusMonths(requirement.getPeriodicityMonths())
                        : requirement.getEffectiveFrom();

                if (nextDueDate == null || dueDate.isBefore(nextDueDate)) {
                    nextDueDate = dueDate;
                }

                boolean pending = !dueDate.isAfter(today);
                if (pending) {
                    pendingRequirements++;
                    pendingItems.add(requirement.getItemType().getName());
                }
            }

            int upToDateRequirements = totalRequirements - pendingRequirements;
            ComplianceStatus status = pendingRequirements > 0 ? ComplianceStatus.PENDING : ComplianceStatus.UP_TO_DATE;

            if (filter == ComplianceStatus.ALL || filter == status) {
                String employeeDocument = includeSensitiveData
                    ? employee.getDocumentNumber()
                    : dataPrivacyService.maskDocument(employee.getDocumentNumber());

                rows.add(new ComplianceRowResponse(
                        employee.getId(),
                    employeeDocument,
                        employee.getFullName(),
                        employee.getArea(),
                        totalRequirements,
                        pendingRequirements,
                        upToDateRequirements,
                        nextDueDate,
                        String.join(", ", pendingItems),
                        status
                ));
            }
        }

        return rows.stream()
                .sorted(Comparator.comparing(ComplianceRowResponse::employeeName))
                .toList();
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        List<ComplianceRowResponse> rows = getComplianceRows(ComplianceStatus.ALL, false);
        long pendingEmployees = rows.stream().filter(row -> row.status() == ComplianceStatus.PENDING).count();
        long upToDateEmployees = rows.stream().filter(row -> row.status() == ComplianceStatus.UP_TO_DATE).count();

        YearMonth currentMonth = YearMonth.now();
        long deliveriesThisMonth = deliveryRepository.countByDeliveredAtBetween(
                currentMonth.atDay(1),
                currentMonth.atEndOfMonth()
        );

        return new DashboardSummaryResponse(
                employeeRepository.countByActiveTrue(),
                pendingEmployees,
                upToDateEmployees,
                deliveriesThisMonth
        );
    }

    @Transactional(readOnly = true)
    public byte[] exportComplianceExcel(boolean includeSensitiveData) {
        List<ComplianceRowResponse> allRows = getComplianceRows(ComplianceStatus.ALL, includeSensitiveData);

        List<ComplianceRowResponse> pendingRows = allRows.stream()
                .filter(row -> row.status() == ComplianceStatus.PENDING)
                .toList();

        List<ComplianceRowResponse> upToDateRows = allRows.stream()
                .filter(row -> row.status() == ComplianceStatus.UP_TO_DATE)
                .toList();

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            writeSheet(workbook, "Consolidado", allRows);
            writeSheet(workbook, "Pendientes", pendingRows);
            writeSheet(workbook, "Al dia", upToDateRows);
            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("No fue posible generar el archivo de Excel.", ex);
        }
    }

    private void writeSheet(XSSFWorkbook workbook, String name, List<ComplianceRowResponse> rows) {
        XSSFSheet sheet = workbook.createSheet(name);
        ExcelStyles styles = buildStyles(workbook);

        String[] headers = {
                "Documento", "Empleado", "Area", "Total Requerimientos", "Pendientes", "Al dia", "Proximo Vencimiento",
            "Implementos Pendientes", "Estado"
        };

        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("Reporte de Cumplimiento de Dotacion");
        titleCell.setCellStyle(styles.titleStyle());
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, headers.length - 1));

        Row metaRow = sheet.createRow(1);
        Cell metaCell = metaRow.createCell(0);
        metaCell.setCellValue("Hoja: " + name + " | Generado: " + EXCEL_DATE_TIME_FORMAT.format(LocalDateTime.now())
                + " | Registros: " + rows.size());
        metaCell.setCellStyle(styles.metaStyle());
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, headers.length - 1));

        Row header = sheet.createRow(3);
        for (int i = 0; i < headers.length; i++) {
            header.createCell(i).setCellValue(headers[i]);
            header.getCell(i).setCellStyle(styles.headerStyle());
        }

        int rowIndex = 4;
        for (ComplianceRowResponse row : rows) {
            Row excelRow = sheet.createRow(rowIndex++);
            boolean evenRow = rowIndex % 2 == 0;
            CellStyle textStyle = evenRow ? styles.rowTextEvenStyle() : styles.rowTextOddStyle();
            CellStyle numberStyle = evenRow ? styles.rowNumberEvenStyle() : styles.rowNumberOddStyle();
            CellStyle dateStyle = evenRow ? styles.rowDateEvenStyle() : styles.rowDateOddStyle();
            CellStyle wrappedStyle = evenRow ? styles.rowWrappedEvenStyle() : styles.rowWrappedOddStyle();

            Cell cell0 = excelRow.createCell(0);
            cell0.setCellValue(row.employeeDocument());
            cell0.setCellStyle(textStyle);

            Cell cell1 = excelRow.createCell(1);
            cell1.setCellValue(row.employeeName());
            cell1.setCellStyle(textStyle);

            Cell cell2 = excelRow.createCell(2);
            cell2.setCellValue(row.area() == null ? "" : row.area());
            cell2.setCellStyle(textStyle);

            Cell cell3 = excelRow.createCell(3);
            cell3.setCellValue(row.totalRequirements());
            cell3.setCellStyle(numberStyle);

            Cell cell4 = excelRow.createCell(4);
            cell4.setCellValue(row.pendingRequirements());
            cell4.setCellStyle(numberStyle);

            Cell cell5 = excelRow.createCell(5);
            cell5.setCellValue(row.upToDateRequirements());
            cell5.setCellStyle(numberStyle);

            Cell cell6 = excelRow.createCell(6);
            if (row.nextDueDate() != null) {
                cell6.setCellValue(java.sql.Date.valueOf(row.nextDueDate()));
            } else {
                cell6.setCellValue("");
            }
            cell6.setCellStyle(dateStyle);

            Cell cell7 = excelRow.createCell(7);
            cell7.setCellValue(row.pendingItems() == null ? "" : row.pendingItems());
            cell7.setCellStyle(wrappedStyle);

            Cell cell8 = excelRow.createCell(8);
            cell8.setCellValue(row.status() == ComplianceStatus.PENDING ? "Pendiente" : "Al dia");
            cell8.setCellStyle(textStyle);
        }

        if (rows.isEmpty()) {
            Row emptyRow = sheet.createRow(rowIndex);
            Cell emptyCell = emptyRow.createCell(0);
            emptyCell.setCellValue("Sin registros para esta hoja.");
            emptyCell.setCellStyle(styles.metaStyle());
            sheet.addMergedRegion(new CellRangeAddress(rowIndex, rowIndex, 0, headers.length - 1));
        }

        sheet.createFreezePane(0, 4);
        sheet.setAutoFilter(new CellRangeAddress(3, Math.max(3, rowIndex - 1), 0, headers.length - 1));

        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }

        sheet.setColumnWidth(7, Math.max(sheet.getColumnWidth(7), 12000));
        sheet.setColumnWidth(8, Math.max(sheet.getColumnWidth(8), 3200));
    }

    private ExcelStyles buildStyles(XSSFWorkbook workbook) {
        short dateFormat = workbook.createDataFormat().getFormat("dd/mm/yyyy");

        Font titleFont = workbook.createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 14);
        titleFont.setColor(IndexedColors.WHITE.getIndex());

        Font metaFont = workbook.createFont();
        metaFont.setItalic(true);
        metaFont.setColor(IndexedColors.GREY_80_PERCENT.getIndex());

        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerFont.setColor(IndexedColors.WHITE.getIndex());

        CellStyle titleStyle = workbook.createCellStyle();
        titleStyle.setFont(titleFont);
        titleStyle.setFillForegroundColor(IndexedColors.BROWN.getIndex());
        titleStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        titleStyle.setAlignment(HorizontalAlignment.LEFT);
        titleStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        titleStyle.setBorderBottom(BorderStyle.THIN);
        titleStyle.setBottomBorderColor(IndexedColors.BROWN.getIndex());

        CellStyle metaStyle = workbook.createCellStyle();
        metaStyle.setFont(metaFont);
        metaStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        metaStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        metaStyle.setAlignment(HorizontalAlignment.LEFT);
        metaStyle.setVerticalAlignment(VerticalAlignment.CENTER);

        CellStyle headerStyle = workbook.createCellStyle();
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.DARK_RED.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);
        headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        setAllBorders(headerStyle, IndexedColors.BROWN.getIndex());

        CellStyle rowTextOdd = workbook.createCellStyle();
        rowTextOdd.setAlignment(HorizontalAlignment.LEFT);
        rowTextOdd.setVerticalAlignment(VerticalAlignment.TOP);
        setAllBorders(rowTextOdd, IndexedColors.GREY_40_PERCENT.getIndex());

        CellStyle rowTextEven = workbook.createCellStyle();
        rowTextEven.cloneStyleFrom(rowTextOdd);
        rowTextEven.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
        rowTextEven.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        CellStyle rowNumberOdd = workbook.createCellStyle();
        rowNumberOdd.cloneStyleFrom(rowTextOdd);
        rowNumberOdd.setAlignment(HorizontalAlignment.CENTER);
        rowNumberOdd.setDataFormat(workbook.createDataFormat().getFormat("0"));

        CellStyle rowNumberEven = workbook.createCellStyle();
        rowNumberEven.cloneStyleFrom(rowNumberOdd);
        rowNumberEven.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
        rowNumberEven.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        CellStyle rowDateOdd = workbook.createCellStyle();
        rowDateOdd.cloneStyleFrom(rowTextOdd);
        rowDateOdd.setAlignment(HorizontalAlignment.CENTER);
        rowDateOdd.setDataFormat(dateFormat);

        CellStyle rowDateEven = workbook.createCellStyle();
        rowDateEven.cloneStyleFrom(rowDateOdd);
        rowDateEven.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
        rowDateEven.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        CellStyle rowWrappedOdd = workbook.createCellStyle();
        rowWrappedOdd.cloneStyleFrom(rowTextOdd);
        rowWrappedOdd.setWrapText(true);

        CellStyle rowWrappedEven = workbook.createCellStyle();
        rowWrappedEven.cloneStyleFrom(rowWrappedOdd);
        rowWrappedEven.setFillForegroundColor(IndexedColors.LEMON_CHIFFON.getIndex());
        rowWrappedEven.setFillPattern(FillPatternType.SOLID_FOREGROUND);

        return new ExcelStyles(
                titleStyle,
                metaStyle,
                headerStyle,
                rowTextOdd,
                rowTextEven,
                rowNumberOdd,
                rowNumberEven,
                rowDateOdd,
                rowDateEven,
                rowWrappedOdd,
                rowWrappedEven
        );
    }

    private void setAllBorders(CellStyle style, short colorIndex) {
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setTopBorderColor(colorIndex);
        style.setBottomBorderColor(colorIndex);
        style.setLeftBorderColor(colorIndex);
        style.setRightBorderColor(colorIndex);
    }

    private record ExcelStyles(
            CellStyle titleStyle,
            CellStyle metaStyle,
            CellStyle headerStyle,
            CellStyle rowTextOddStyle,
            CellStyle rowTextEvenStyle,
            CellStyle rowNumberOddStyle,
            CellStyle rowNumberEvenStyle,
            CellStyle rowDateOddStyle,
            CellStyle rowDateEvenStyle,
            CellStyle rowWrappedOddStyle,
            CellStyle rowWrappedEvenStyle
    ) {
    }

    private Map<String, LocalDate> buildLatestDeliveryMap(List<UUID> employeeIds) {
        if (employeeIds.isEmpty()) {
            return Map.of();
        }

        List<LastDeliverySnapshot> snapshots = deliveryItemRepository.findLatestDeliveriesByEmployeeIds(employeeIds);

        Map<String, LocalDate> latestByEmployeeAndItem = new HashMap<>();
        for (LastDeliverySnapshot snapshot : snapshots) {
            latestByEmployeeAndItem.put(buildKey(snapshot.employeeId(), snapshot.itemTypeId()), snapshot.lastDeliveredAt());
        }
        return latestByEmployeeAndItem;
    }

    private String buildKey(UUID employeeId, UUID itemTypeId) {
        return employeeId + "::" + itemTypeId;
    }
}
