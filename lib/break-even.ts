import { subMonths, startOfMonth, endOfMonth, format } from "date-fns"

// Interface para as transações individuais (mantido para compatibilidade com código existente)
interface Transaction {
  restaurant_id: string
  transaction_type: 'RECEITA' | 'CUSTO'
  cost_type: 'FIXO' | 'VARIAVEL' | null
  amount: number
  description: string
  date: string
  created_at: string
  updated_at: string
}

// Interface para os dados agregados retornados do BigQuery
interface BigQueryBreakEvenRow {
  month: string; // Formato "YYYY-MM-DD" (primeiro dia do mês)
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

export function calculateBreakEven(data: any[]): BreakEvenData {
  // Verificar se os dados são no formato BigQuery ou no formato de transações
  const isBigQueryFormat = data.length > 0 && 'month' in data[0] && 'total_revenue' in data[0];
  
  if (isBigQueryFormat) {
    return calculateBreakEvenFromBigQuery(data as BigQueryBreakEvenRow[]);
  } else {
    return calculateBreakEvenFromTransactions(data as Transaction[]);
  }
}

// Nova função para calcular break-even a partir dos dados agregados do BigQuery
function calculateBreakEvenFromBigQuery(rows: BigQueryBreakEvenRow[]): BreakEvenData {
  // Ordenar os dados por mês (mais recente primeiro)
  const sortedRows = [...rows].sort((a, b) => {
    return new Date(b.month).getTime() - new Date(a.month).getTime();
  });

  // Obter dados dos últimos meses
  const currentMonthData = sortedRows[0] || {
    fixed_costs: 0,
    variable_costs: 0,
    total_revenue: 0,
    break_even_revenue: 0
  };
  
  const lastMonthData = sortedRows[1] || {
    fixed_costs: 0,
    variable_costs: 0,
    total_revenue: 0,
    break_even_revenue: 0
  };

  // Calcular projeção para o próximo mês
  const revenueRatio = currentMonthData.total_revenue && lastMonthData.total_revenue
    ? currentMonthData.total_revenue / lastMonthData.total_revenue
    : 1.1; // Crescimento padrão de 10% se não houver dados

  const projectedRevenue = currentMonthData.total_revenue * revenueRatio;
  const projectedVariableCosts = currentMonthData.variable_costs * revenueRatio;
  const projectedFixedCosts = currentMonthData.fixed_costs; // Custos fixos geralmente não mudam
  const projectedTotalCosts = projectedFixedCosts + projectedVariableCosts;
  
  // Calcular break-even point para próximo mês
  const projectedBreakEvenPoint = projectedFixedCosts / (1 - (projectedVariableCosts / projectedRevenue));

  return {
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
}

// Função original renomeada para manter compatibilidade
function calculateBreakEvenFromTransactions(transactions: Transaction[]): BreakEvenData {
  const now = new Date()
  const currentMonthStart = startOfMonth(now)
  const currentMonthEnd = endOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  // Filtra transações por período
  const currentMonthTransactions = transactions.filter(
    (t) => new Date(t.date) >= currentMonthStart && new Date(t.date) <= currentMonthEnd
  )
  const lastMonthTransactions = transactions.filter(
    (t) => new Date(t.date) >= lastMonthStart && new Date(t.date) <= lastMonthEnd
  )

  // Calcula custos fixos e variáveis
  const calculateCosts = (transactions: Transaction[]) => {
    const costs = transactions.filter(t => t.transaction_type === 'CUSTO')
    const fixedCosts = costs
      .filter((cost) => cost.cost_type === "FIXO")
      .reduce((sum, cost) => sum + cost.amount, 0)
    const variableCosts = costs
      .filter((cost) => cost.cost_type === "VARIAVEL")
      .reduce((sum, cost) => sum + cost.amount, 0)
    return {
      fixedCosts,
      variableCosts,
      totalCosts: fixedCosts + variableCosts,
    }
  }

  // Calcula receitas
  const calculateRevenue = (transactions: Transaction[]) => {
    return transactions
      .filter(t => t.transaction_type === 'RECEITA')
      .reduce((sum, t) => sum + t.amount, 0)
  }

  // Calcula ponto de break-even
  const calculateBreakEvenPoint = (fixedCosts: number, variableCosts: number, revenue: number) => {
    if (revenue === 0) return fixedCosts
    const variableCostPercentage = variableCosts / revenue
    return fixedCosts / (1 - variableCostPercentage)
  }

  // Dados do mês atual
  const currentMonthCostsData = calculateCosts(currentMonthTransactions)
  const currentMonthRevenue = calculateRevenue(currentMonthTransactions)
  const currentMonthBreakEvenPoint = calculateBreakEvenPoint(
    currentMonthCostsData.fixedCosts,
    currentMonthCostsData.variableCosts,
    currentMonthRevenue
  )

  // Dados do mês anterior
  const lastMonthCostsData = calculateCosts(lastMonthTransactions)
  const lastMonthRevenue = calculateRevenue(lastMonthTransactions)
  const lastMonthBreakEvenPoint = calculateBreakEvenPoint(
    lastMonthCostsData.fixedCosts,
    lastMonthCostsData.variableCosts,
    lastMonthRevenue
  )

  // Projeção para o próximo mês (usando média de crescimento dos últimos 2 meses)
  const revenueGrowth = lastMonthRevenue > 0 ? currentMonthRevenue / lastMonthRevenue : 1.1
  const projectedRevenue = currentMonthRevenue * revenueGrowth

  const projectedFixedCosts = currentMonthCostsData.fixedCosts
  const projectedVariableCosts = currentMonthCostsData.variableCosts * revenueGrowth
  const projectedTotalCosts = projectedFixedCosts + projectedVariableCosts
  const projectedBreakEvenPoint = calculateBreakEvenPoint(
    projectedFixedCosts,
    projectedVariableCosts,
    projectedRevenue
  )

  return {
    currentMonth: {
      fixedCosts: currentMonthCostsData.fixedCosts,
      variableCosts: currentMonthCostsData.variableCosts,
      totalCosts: currentMonthCostsData.totalCosts,
      revenue: currentMonthRevenue,
      breakEvenPoint: currentMonthBreakEvenPoint,
    },
    lastMonth: {
      fixedCosts: lastMonthCostsData.fixedCosts,
      variableCosts: lastMonthCostsData.variableCosts,
      totalCosts: lastMonthCostsData.totalCosts,
      revenue: lastMonthRevenue,
      breakEvenPoint: lastMonthBreakEvenPoint,
    },
    nextMonth: {
      fixedCosts: projectedFixedCosts,
      variableCosts: projectedVariableCosts,
      totalCosts: projectedTotalCosts,
      projectedRevenue,
      breakEvenPoint: projectedBreakEvenPoint,
    },
  }
} 