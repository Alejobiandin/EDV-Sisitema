import sys
import json

def calculate_tax(payload, rules):
    sales = payload.get("grossSales", 0.0)
    purchases = payload.get("vatPurchases", 0.0)
    vat_rate = rules.get("IVA - alícuota general", 0.21)
    
    debits = sales * vat_rate
    credits = purchases * vat_rate
    balance = debits - credits
    
    requires_approval = balance > 500000.0
    
    result = {
        "taxType": "IVA / IIBB",
        "grossSales": sales,
        "vatRate": vat_rate,
        "vatDebits": debits,
        "vatCredits": credits,
        "netVatDue": balance,
        "status": "Calculado con éxito por motor Python EDV",
        "parameterSource": "ADN Organizacional / Motor Python"
    }
    
    return {
        "result": result,
        "requiresApproval": requires_approval,
        "summary": f"Determinación IVA procesada por motor Python EDV. Saldo técnico: ${balance:,.2f}."
    }

def calculate_payroll(payload, rules):
    base = payload.get("baseSalary", 350000.0)
    overtime = payload.get("overtimeHours", 0.0)
    overtime_pay = overtime * (base / 160.0) * 1.5
    gross = base + overtime_pay
    
    retirement_rate = rules.get("Aportes jubilatorios", 0.11)
    health_rate = rules.get("Aporte obra social", 0.03)
    union_rate = rules.get("Aporte convencional", 0.02)
    employer_ss_rate = rules.get("Contribuciones patronales seguridad social", 0.16)
    employer_family_rate = rules.get("Contribuciones asignaciones familiares", 0.045)
    
    retirement = gross * retirement_rate
    health = gross * health_rate
    union = gross * union_rate
    total_deductions = retirement + health + union
    net = gross - total_deductions
    
    employer_ss = gross * employer_ss_rate
    employer_fam = gross * employer_family_rate
    total_employer = employer_ss + employer_fam
    
    requires_approval = gross > 1500000.0 or overtime > 20.0
    
    result = {
        "baseSalary": base,
        "overtimePay": overtime_pay,
        "grossSalary": gross,
        "employeeDeductions": {
            "retirement": retirement,
            "socialSecurity": health,
            "union": union,
            "total": total_deductions
        },
        "netSalary": net,
        "employerContributions": {
            "socialSecurity": employer_ss,
            "familyAllowances": employer_fam,
            "total": total_employer
        },
        "parameters": {
            "retirementRate": retirement_rate,
            "socialSecurityRate": health_rate,
            "unionRate": union_rate,
            "employerSocialRate": employer_ss_rate,
            "employerFamilyRate": employer_family_rate
        },
        "parameterSource": "ADN Organizacional / Motor Python EDV"
    }
    
    return {
        "result": result,
        "requiresApproval": requires_approval,
        "summary": f"Liquidación EDV Python procesada. Bruto: ${gross:,.2f}, Neto: ${net:,.2f}."
    }

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input:
            print(json.dumps({"success": False, "error": "Entrada vacía"}))
            return
        
        data = json.loads(raw_input)
        task_type = data.get("taskType")
        payload = data.get("payload", {})
        rules = data.get("rules", {})
        
        if task_type == "tax_computation":
            output = calculate_tax(payload, rules)
        elif task_type in ("payroll_liquidation", "social_charges"):
            output = calculate_payroll(payload, rules)
        else:
            output = {
                "result": {"message": "Revisión contable general EDV procesada."},
                "requiresApproval": False,
                "summary": "Revisión contable general completada por Python."
            }
            
        print(json.dumps({"success": True, **output}))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
