package com.inventario.dotacion.report;

import com.inventario.dotacion.report.dto.DashboardSummaryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ComplianceService complianceService;

    @GetMapping("/summary")
    public DashboardSummaryResponse getSummary() {
        return complianceService.getDashboardSummary();
    }
}
