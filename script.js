// Cyprus Tax Calculator 2026
// Based on the Cyprus Tax Reform effective from January 1, 2026

// Tax brackets for 2026
const TAX_BRACKETS = [
    { min: 0, max: 22000, rate: 0 },
    { min: 22001, max: 32000, rate: 0.20 },
    { min: 32001, max: 42000, rate: 0.25 },
    { min: 42001, max: 72000, rate: 0.30 },
    { min: 72001, max: Infinity, rate: 0.35 }
];

// Income criteria for family deductions
const INCOME_CRITERIA = {
    single: 40000,
    family_0_2_children: 100000,
    family_3_4_children: 150000,
    family_5_plus_children: 200000
};

// Child deduction amounts
const CHILD_DEDUCTIONS = {
    first: 1000,
    second: 1250,
    third: 1500
};

// Maximum deductions
const MAX_DEDUCTIONS = {
    housing: 2000, // per person
    greenInvestment: 1000, // per person per year
    homeInsurance: 500
};

// DOM Elements
const form = document.getElementById('taxForm');
const familyStatus = document.getElementById('familyStatus');
const spouseIncomeGroup = document.getElementById('spouseIncomeGroup');
const numChildren = document.getElementById('numChildren');
const childrenInfo = document.getElementById('childrenInfo');
const housingType = document.getElementById('housingType');
const housingAmountGroup = document.getElementById('housingAmountGroup');
const hasGreenInvestment = document.getElementById('hasGreenInvestment');
const greenInvestmentGroup = document.getElementById('greenInvestmentGroup');
const resultsSection = document.getElementById('results');

// Event Listeners
familyStatus.addEventListener('change', function() {
    if (this.value === 'married') {
        spouseIncomeGroup.style.display = 'block';
    } else {
        spouseIncomeGroup.style.display = 'none';
        document.getElementById('spouseIncome').value = '';
    }
    updateChildrenInfo();
});

numChildren.addEventListener('input', updateChildrenInfo);

housingType.addEventListener('change', function() {
    if (this.value !== 'none') {
        housingAmountGroup.style.display = 'block';
    } else {
        housingAmountGroup.style.display = 'none';
        document.getElementById('housingAmount').value = '';
    }
});

hasGreenInvestment.addEventListener('change', function() {
    if (this.checked) {
        greenInvestmentGroup.style.display = 'block';
    } else {
        greenInvestmentGroup.style.display = 'none';
        document.getElementById('greenInvestmentAmount').value = '';
        document.getElementById('greenSubsidy').value = '';
    }
});

form.addEventListener('submit', function(e) {
    e.preventDefault();
    calculateTax();
});

// Add listener for gross income to calculate social insurance suggestion
document.getElementById('grossIncome').addEventListener('input', function() {
    updateSocialInsuranceSuggestion();
});

// Function to update social insurance suggestion
function updateSocialInsuranceSuggestion() {
    const grossIncome = parseFloat(document.getElementById('grossIncome').value) || 0;
    const suggestionBox = document.getElementById('socialInsuranceSuggestion');
    const suggestedAmountSpan = document.getElementById('suggestedAmount');
    
    if (grossIncome > 0) {
        const socialInsurance = grossIncome * 0.088; // 8.8%
        const ghs = grossIncome * 0.029; // 2.90%
        const total = grossIncome * 0.117; // 11.7%
        
        suggestedAmountSpan.innerHTML = `
            For salary €${grossIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}:<br>
            • Social Insurance (8.8%): €${socialInsurance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}<br>
            • GHS (2.90%): €${ghs.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}<br>
            <strong>Total: €${total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
        `;
        suggestionBox.style.display = 'block';
    } else {
        suggestionBox.style.display = 'none';
    }
}

// Function to use the suggested amount
function useSuggestion() {
    const grossIncome = parseFloat(document.getElementById('grossIncome').value) || 0;
    const total = grossIncome * 0.117;
    document.getElementById('socialInsurance').value = total.toFixed(2);
    
    // Add visual feedback
    const input = document.getElementById('socialInsurance');
    input.style.background = '#d1fae5';
    setTimeout(() => {
        input.style.background = '';
    }, 1000);
}

// Update children information display
function updateChildrenInfo() {
    const children = parseInt(numChildren.value) || 0;
    const status = familyStatus.value;
    
    if (children > 0 && status) {
        childrenInfo.style.display = 'block';
        
        const breakdown = document.getElementById('childrenBreakdown');
        breakdown.innerHTML = '';
        
        let totalDeduction = 0;
        const isSingleParent = status === 'singleParent';
        const multiplier = isSingleParent ? 2 : 1;
        
        for (let i = 1; i <= children; i++) {
            let amount;
            if (i === 1) amount = CHILD_DEDUCTIONS.first;
            else if (i === 2) amount = CHILD_DEDUCTIONS.second;
            else amount = CHILD_DEDUCTIONS.third;
            
            amount *= multiplier;
            totalDeduction += amount;
            
            const li = document.createElement('li');
            li.textContent = `Child ${i}: €${amount.toLocaleString()}`;
            breakdown.appendChild(li);
        }
        
        const totalLi = document.createElement('li');
        totalLi.innerHTML = `<strong>Total: €${totalDeduction.toLocaleString()}</strong>`;
        breakdown.appendChild(totalLi);
        
        // Display income criteria
        const criteriaElement = document.getElementById('incomeCriteria');
        let incomeLimit;
        
        if (status === 'single') {
            incomeLimit = INCOME_CRITERIA.single;
        } else if (children <= 2) {
            incomeLimit = INCOME_CRITERIA.family_0_2_children;
        } else if (children <= 4) {
            incomeLimit = INCOME_CRITERIA.family_3_4_children;
        } else {
            incomeLimit = INCOME_CRITERIA.family_5_plus_children;
        }
        
        criteriaElement.textContent = `Income must not exceed €${incomeLimit.toLocaleString()} to qualify for deductions`;
    } else {
        childrenInfo.style.display = 'none';
    }
}

// Calculate tax based on brackets
function calculateBaseTax(taxableIncome) {
    let tax = 0;
    let breakdown = [];
    
    for (let bracket of TAX_BRACKETS) {
        if (taxableIncome > bracket.min) {
            // Calculate how much income falls in this bracket
            const upperLimit = Math.min(taxableIncome, bracket.max);
            const taxableInBracket = upperLimit - bracket.min;
            const taxInBracket = taxableInBracket * bracket.rate;
            
            // Only add to breakdown if there's actual income in this bracket
            if (taxableInBracket > 0) {
                breakdown.push({
                    bracket: `€${bracket.min.toLocaleString()} - ${bracket.max === Infinity ? '∞' : '€' + bracket.max.toLocaleString()}`,
                    rate: (bracket.rate * 100).toFixed(0) + '%',
                    taxableAmount: taxableInBracket,
                    tax: taxInBracket
                });
                
                tax += taxInBracket;
            }
        }
    }
    
    return { tax, breakdown };
}

// Check eligibility for personal deductions
function checkEligibility(grossIncome, spouseIncome, numChildren, familyStatus) {
    const totalIncome = grossIncome + (spouseIncome || 0);
    let incomeLimit;
    
    if (familyStatus === 'single') {
        incomeLimit = INCOME_CRITERIA.single;
    } else if (numChildren <= 2) {
        incomeLimit = INCOME_CRITERIA.family_0_2_children;
    } else if (numChildren <= 4) {
        incomeLimit = INCOME_CRITERIA.family_3_4_children;
    } else {
        incomeLimit = INCOME_CRITERIA.family_5_plus_children;
    }
    
    return {
        eligible: totalIncome <= incomeLimit,
        totalIncome,
        incomeLimit
    };
}

// Calculate child deductions
function calculateChildDeductions(numChildren, isSingleParent) {
    let total = 0;
    const multiplier = isSingleParent ? 2 : 1;
    
    for (let i = 1; i <= numChildren; i++) {
        if (i === 1) total += CHILD_DEDUCTIONS.first * multiplier;
        else if (i === 2) total += CHILD_DEDUCTIONS.second * multiplier;
        else total += CHILD_DEDUCTIONS.third * multiplier;
    }
    
    return total;
}

// Main calculation function
function calculateTax() {
    // Get form values
    const grossIncome = parseFloat(document.getElementById('grossIncome').value) || 0;
    const spouseIncome = parseFloat(document.getElementById('spouseIncome').value) || 0;
    const status = familyStatus.value;
    const children = parseInt(numChildren.value) || 0;
    const housingExpenseType = housingType.value;
    const housingAmount = parseFloat(document.getElementById('housingAmount').value) || 0;
    const greenInvestment = hasGreenInvestment.checked;
    const greenAmount = parseFloat(document.getElementById('greenInvestmentAmount').value) || 0;
    const greenSubsidy = parseFloat(document.getElementById('greenSubsidy').value) || 0;
    const homeInsurance = parseFloat(document.getElementById('homeInsurance').value) || 0;
    const lifeInsurance = parseFloat(document.getElementById('lifeInsurance').value) || 0;
    const socialInsurance = parseFloat(document.getElementById('socialInsurance').value) || 0;
    const dividendIncome = parseFloat(document.getElementById('dividendIncome').value) || 0;
    const interestIncome = parseFloat(document.getElementById('interestIncome').value) || 0;
    
    // Calculate exempt income
    const exemptIncome = dividendIncome + interestIncome;
    
    // Calculate taxable income before standard deductions
    const taxableBeforeStd = grossIncome - exemptIncome;
    
    // Calculate standard deductions (1/5 rule - 20% of net income limit)
    const standardDeductionsTotal = lifeInsurance + socialInsurance;
    const maxStandardDeduction = taxableBeforeStd * 0.20;
    const standardDeductions = Math.min(standardDeductionsTotal, maxStandardDeduction);
    
    // Calculate net income after standard deductions
    let netIncome = taxableBeforeStd - standardDeductions;
    
    // Check eligibility for personal deductions
    const eligibility = checkEligibility(grossIncome, spouseIncome, children, status);
    
    // Calculate personal deductions (these reduce income BEFORE tax calculation)
    let personalDeductions = 0;
    let appliedDeductions = [];
    
    // Child deductions
    if (eligibility.eligible && children > 0) {
        const isSingleParent = status === 'singleParent';
        const childDeduction = calculateChildDeductions(children, isSingleParent);
        personalDeductions += childDeduction;
        appliedDeductions.push({
            type: 'Dependent Children',
            amount: childDeduction,
            description: `${children} child${children > 1 ? 'ren' : ''} ${isSingleParent ? '(Single Parent - Double Rate)' : ''}`
        });
    }
    
    // Housing deductions
    if (eligibility.eligible && housingExpenseType !== 'none' && housingAmount > 0) {
        const housingDeduction = Math.min(housingAmount, MAX_DEDUCTIONS.housing);
        personalDeductions += housingDeduction;
        appliedDeductions.push({
            type: housingExpenseType === 'rent' ? 'Rent' : 'Mortgage Interest',
            amount: housingDeduction,
            description: `Maximum €${MAX_DEDUCTIONS.housing.toLocaleString()} per person`
        });
    }
    
    // Green investment deductions
    if (eligibility.eligible && greenInvestment && greenAmount > 0) {
        const netGreenAmount = greenAmount - greenSubsidy;
        const greenDeduction = Math.min(netGreenAmount, MAX_DEDUCTIONS.greenInvestment);
        personalDeductions += greenDeduction;
        appliedDeductions.push({
            type: 'Energy Efficiency / Electric Vehicle',
            amount: greenDeduction,
            description: `Net expense: €${netGreenAmount.toLocaleString()} (max €${MAX_DEDUCTIONS.greenInvestment.toLocaleString()}/year, carry forward available)`
        });
    }
    
    // Home insurance deduction (no income criteria)
    if (homeInsurance > 0) {
        const insuranceDeduction = Math.min(homeInsurance, MAX_DEDUCTIONS.homeInsurance);
        personalDeductions += insuranceDeduction;
        appliedDeductions.push({
            type: 'Home Insurance (Natural Disasters)',
            amount: insuranceDeduction,
            description: `Maximum €${MAX_DEDUCTIONS.homeInsurance} (no income criteria)`
        });
    }
    
    // Apply personal deductions to net income
    const incomeAfterPersonalDeductions = Math.max(0, netIncome - personalDeductions);
    
    // The tax brackets already include the €22,000 tax-free allowance (0% rate)
    // Apply tax brackets to income after all deductions
    const taxableIncome = incomeAfterPersonalDeductions;
    
    // Calculate final tax on the reduced income
    const { tax: finalTax, breakdown: taxBreakdown } = calculateBaseTax(taxableIncome);
    
    // Calculate effective tax rate
    const effectiveRate = grossIncome > 0 ? (finalTax / grossIncome) * 100 : 0;
    
    // Display results
    displayResults({
        grossIncome,
        exemptIncome,
        taxableBeforeStd,
        standardDeductions,
        netIncome,
        personalDeductions,
        incomeAfterPersonalDeductions,
        taxableIncome,
        finalTax,
        effectiveRate,
        taxBreakdown,
        appliedDeductions,
        eligibility
    });
}

// Display calculation results
function displayResults(results) {
    // Update result cards
    document.getElementById('resultGrossIncome').textContent = `€${results.grossIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('resultExemptIncome').textContent = `€${results.exemptIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('resultTaxableBeforeStd').textContent = `€${results.taxableBeforeStd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('resultStandardDeductions').textContent = `€${results.standardDeductions.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('resultNetIncome').textContent = `€${results.netIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('resultPersonalDeductions').textContent = `€${results.personalDeductions.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('resultTaxableIncome').textContent = `€${results.incomeAfterPersonalDeductions.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('resultFinalTax').textContent = `€${results.finalTax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    document.getElementById('resultEffectiveRate').textContent = `${results.effectiveRate.toFixed(2)}%`;
    
    // Display calculation flow
    const flowDiv = document.getElementById('calculationFlow');
    let flowHTML = '';
    
    // Step 1: Gross Income
    flowHTML += `
        <div class="flow-step">
            <div class="flow-step-icon">1</div>
            <div class="flow-step-content">
                <div class="flow-step-title">Gross Income</div>
                <div class="flow-step-details">Total income from all sources</div>
                <div class="flow-step-amount">€${results.grossIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
        </div>
    `;
    
    // Step 2: Exempt Income
    if (results.exemptIncome > 0) {
        flowHTML += `
            <div class="flow-arrow">↓</div>
            <div class="flow-step">
                <div class="flow-step-icon">2</div>
                <div class="flow-step-content">
                    <div class="flow-step-title">Less: Exempt Income</div>
                    <div class="flow-step-details">Dividends and interest income (not taxable)</div>
                    <div class="flow-step-amount">- €${results.exemptIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
            </div>
        `;
    }
    
    flowHTML += `
        <div class="flow-arrow">↓</div>
        <div class="flow-step">
            <div class="flow-step-icon">=</div>
            <div class="flow-step-content">
                <div class="flow-step-title">Taxable Income (Before Standard Deductions)</div>
                <div class="flow-step-amount">€${results.taxableBeforeStd.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
        </div>
    `;
    
    // Step 3: Standard Deductions
    if (results.standardDeductions > 0) {
        flowHTML += `
            <div class="flow-arrow">↓</div>
            <div class="flow-step">
                <div class="flow-step-icon">3</div>
                <div class="flow-step-content">
                    <div class="flow-step-title">Less: Standard Deductions (1/5 Rule - Max 20% of Income)</div>
                    <div class="flow-step-details">Social insurance, pension contributions, life insurance, medical insurance</div>
                    <div class="flow-step-amount">- €${results.standardDeductions.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
            </div>
        `;
    }
    
    flowHTML += `
        <div class="flow-arrow">↓</div>
        <div class="flow-step">
            <div class="flow-step-icon">=</div>
            <div class="flow-step-content">
                <div class="flow-step-title">Net Income (After Standard Deductions)</div>
                <div class="flow-step-amount">€${results.netIncome.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
        </div>
    `;
    
    // Step 4: Personal Deductions
    if (results.personalDeductions > 0) {
        flowHTML += `
            <div class="flow-arrow">↓</div>
            <div class="flow-step highlight">
                <div class="flow-step-icon">4</div>
                <div class="flow-step-content">
                    <div class="flow-step-title">Less: Personal Deductions (Reduce Income)</div>
                    <div class="flow-step-details">Children, housing, green investments, insurance (subject to income criteria)</div>
                    <div class="flow-step-amount">- €${results.personalDeductions.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                </div>
            </div>
        `;
    }
    
    flowHTML += `
        <div class="flow-arrow">↓</div>
        <div class="flow-step highlight">
            <div class="flow-step-icon">=</div>
            <div class="flow-step-content">
                <div class="flow-step-title">Taxable Income (After All Deductions)</div>
                <div class="flow-step-details">This is the amount subject to progressive tax brackets</div>
                <div class="flow-step-amount">€${results.incomeAfterPersonalDeductions.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
        </div>
    `;
    
    // Step 5: Progressive Tax Calculation (includes tax-free allowance in first bracket)
    flowHTML += `
        <div class="flow-arrow">↓</div>
        <div class="flow-step">
            <div class="flow-step-icon">5</div>
            <div class="flow-step-content">
                <div class="flow-step-title">Apply Progressive Tax Brackets</div>
                <div class="flow-step-details">First €22,000 @ 0%, then 20%, 25%, 30%, 35% on higher amounts. See breakdown below.</div>
                <div class="flow-step-amount">€${results.finalTax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
        </div>
    `;
    
    flowHTML += `
        <div class="flow-arrow">↓</div>
        <div class="flow-step highlight">
            <div class="flow-step-icon">✓</div>
            <div class="flow-step-content">
                <div class="flow-step-title">Final Income Tax Due</div>
                <div class="flow-step-details">Total tax liability for the year</div>
                <div class="flow-step-amount" style="font-size: 1.5rem;">€${results.finalTax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
            </div>
        </div>
    `;
    
    flowDiv.innerHTML = flowHTML;
    
    // Display detailed breakdown
    const breakdownDiv = document.getElementById('detailedBreakdown');
    let breakdownHTML = '<table><thead><tr><th>Tax Bracket</th><th>Rate</th><th>Taxable Amount</th><th>Tax</th></tr></thead><tbody>';
    
    if (results.taxBreakdown.length === 0) {
        breakdownHTML += '<tr><td colspan="4" style="text-align: center;">No tax due (income below tax-free threshold of €22,000)</td></tr>';
    } else {
        for (let item of results.taxBreakdown) {
            breakdownHTML += `
                <tr>
                    <td>${item.bracket}</td>
                    <td>${item.rate}</td>
                    <td>€${item.taxableAmount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td>€${item.tax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                </tr>
            `;
        }
        breakdownHTML += `
            <tr style="background: var(--light-bg); font-weight: 700;">
                <td colspan="3" style="text-align: right; padding-right: 20px;">Total Tax:</td>
                <td>€${results.finalTax.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
            </tr>
        `;
    }
    
    breakdownHTML += '</tbody></table>';
    breakdownDiv.innerHTML = breakdownHTML;
    
    // Display applied deductions
    const deductionsDiv = document.getElementById('appliedDeductions');
    if (results.appliedDeductions.length === 0) {
        deductionsDiv.innerHTML = '<p>No personal deductions applied.</p>';
    } else {
        let deductionsHTML = '';
        for (let deduction of results.appliedDeductions) {
            deductionsHTML += `
                <div class="deduction-item">
                    <strong>${deduction.type}:</strong> €${deduction.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    <br><small>${deduction.description}</small>
                </div>
            `;
        }
        deductionsDiv.innerHTML = deductionsHTML;
    }
    
    // Display eligibility status
    const eligibilityDiv = document.getElementById('eligibilityStatus');
    let eligibilityHTML = '';
    
    if (results.eligibility.eligible) {
        eligibilityHTML = `
            <div class="eligibility-item eligible">
                <span class="icon">✅</span>
                <div>
                    <strong>Eligible for Personal Deductions</strong><br>
                    <small>Total household income: €${results.eligibility.totalIncome.toLocaleString()} (limit: €${results.eligibility.incomeLimit.toLocaleString()})</small>
                </div>
            </div>
        `;
    } else {
        eligibilityHTML = `
            <div class="eligibility-item not-eligible">
                <span class="icon">❌</span>
                <div>
                    <strong>Not Eligible for Personal Deductions</strong><br>
                    <small>Total household income: €${results.eligibility.totalIncome.toLocaleString()} exceeds limit: €${results.eligibility.incomeLimit.toLocaleString()}</small>
                </div>
            </div>
        `;
    }
    
    eligibilityDiv.innerHTML = eligibilityHTML;
    
    // Show results section
    resultsSection.style.display = 'block';
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Initialize
updateChildrenInfo();

