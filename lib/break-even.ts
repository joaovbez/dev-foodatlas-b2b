import { subMonths, startOfMonth, endOfMonth } from "date-fns"

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

export function calculateBreakEven(transactions: Transaction[]): BreakEvenData {
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
  const revenueGrowth = currentMonthRevenue / lastMonthRevenue
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