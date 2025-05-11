import { subMonths, startOfMonth, endOfMonth, format } from "date-fns"

// Interface para os dados agregados retornados do BigQuery
interface BigQueryBreakEvenRow {
  month: {
    value: string;
  };
  gross_sales: number;
  delivery_revenue: number;
  total_revenue: number;
  variable_costs: number;
  fixed_costs: number;
  contribution_margin_ratio: number;
  break_even_revenue: number;
}

interface BreakEvenData {
  currentMonth: {
    fixedCosts: number
    variableCosts: number
    totalCosts: number
    revenue: number
    breakEvenPoint: number
  }
  lastMonth: {
    fixedCosts: number
    variableCosts: number
    totalCosts: number
    revenue: number
    breakEvenPoint: number
  }
  nextMonth: {
    fixedCosts: number
    variableCosts: number
    totalCosts: number
    projectedRevenue: number
    breakEvenPoint: number
  }
}

export function calculateBreakEven(data: BigQueryBreakEvenRow[]): BreakEvenData {
  console.log('Dados recebidos:', data);

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));

  let currentMonthData = {
    fixed_costs: 0,
    variable_costs: 0,
    total_revenue: 0,
    break_even_revenue: 0
  };
  
  let lastMonthData = {
    fixed_costs: 0,
    variable_costs: 0,
    total_revenue: 0,
    break_even_revenue: 0
  };

  // Ordena os dados por mês (mais recente primeiro)
  const sortedRows = [...data].sort((a, b) =>
    new Date(b.month.value).getTime() - new Date(a.month.value).getTime()
  )

  console.log('Dados ordenados:', sortedRows)
  console.log('Datas de referência:', {
    currentMonthStart: format(currentMonthStart, 'yyyy-MM-dd'),
    lastMonthStart:    format(lastMonthStart,    'yyyy-MM-dd')
  })

  // Cria chaves “YYYY-MM” para comparar diretamente
  const currentKey = format(currentMonthStart, 'yyyy-MM')  // ex: "2025-05"
  const lastKey    = format(lastMonthStart,    'yyyy-MM')  // ex: "2025-04"

  console.log('Chaves de comparação:', { currentKey, lastKey })

  // Encontra o dado do mês atual e do mês anterior sem problemas de fuso
  currentMonthData = sortedRows.find(row =>
    row.month.value.slice(0, 7) === currentKey
  ) || currentMonthData

  lastMonthData = sortedRows.find(row =>
    row.month.value.slice(0, 7) === lastKey
  ) || lastMonthData

  console.log('Dados encontrados:', {
    currentMonth: currentMonthData,
    lastMonth:    lastMonthData
  })

  // Calcular projeção para o próximo mês (modelo experimental, falta implementar o modelo de previsão)
  const revenueRatio = currentMonthData.total_revenue && lastMonthData.total_revenue
    ? currentMonthData.total_revenue / lastMonthData.total_revenue
    : 1.1; // Crescimento padrão de 10% se não houver dados

  const projectedRevenue = currentMonthData.total_revenue * revenueRatio;
  const projectedVariableCosts = currentMonthData.variable_costs * revenueRatio;
  const projectedFixedCosts = currentMonthData.fixed_costs; // Custos fixos geralmente não mudam
  const projectedTotalCosts = projectedFixedCosts + projectedVariableCosts;
  
  // Calcular break-even point para próximo mês
  const projectedBreakEvenPoint = projectedFixedCosts / (1 - (projectedVariableCosts / projectedRevenue || 0));

  const result = {
    currentMonth: {
      fixedCosts: currentMonthData.fixed_costs || 0,
      variableCosts: currentMonthData.variable_costs || 0,
      totalCosts: (currentMonthData.fixed_costs || 0) + (currentMonthData.variable_costs || 0),
      revenue: currentMonthData.total_revenue || 0,
      breakEvenPoint: currentMonthData.break_even_revenue || 0
    },
    lastMonth: {
      fixedCosts: lastMonthData.fixed_costs || 0,
      variableCosts: lastMonthData.variable_costs || 0,
      totalCosts: (lastMonthData.fixed_costs || 0) + (lastMonthData.variable_costs || 0),
      revenue: lastMonthData.total_revenue || 0,
      breakEvenPoint: lastMonthData.break_even_revenue || 0
    },
    nextMonth: {
      fixedCosts: projectedFixedCosts,
      variableCosts: projectedVariableCosts,
      totalCosts: projectedTotalCosts,
      projectedRevenue: projectedRevenue,
      breakEvenPoint: projectedBreakEvenPoint
    }
  };

  console.log('Resultado final:', result);
  return result;
} 