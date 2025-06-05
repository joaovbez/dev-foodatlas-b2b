import { bigquery } from '@/lib/google-big-query';

export async function getBreakEvenData(
    restaurantId: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const projectId  = process.env.GOOGLE_CLOUD_PROJECT_ID!;
    const datasetId  = process.env.BIGQUERY_DATASET!;
    const stockTable = process.env.BIGQUERY_TABLE_STOCK_CONTROL!;
    const integTable = process.env.BIGQUERY_TABLE_INTEGRATED_REPORT!;
    const delivTable = process.env.BIGQUERY_TABLE_DELIVERY_REPORT!;
  
    const query = `
      WITH
        stock_usage AS (
          SELECT
            DATE_TRUNC(data, MONTH) AS month,
            SUM(qtd_usada_unidades * custo_unitario_brl) AS stock_cost
          FROM \`${projectId}.${datasetId}.${stockTable}\`
          WHERE restaurant_id = @restaurantId
            AND data BETWEEN
              PARSE_DATE('%Y-%m-%d', @startDate)
              AND PARSE_DATE('%Y-%m-%d', @endDate)
          GROUP BY month
        ),
        integrated AS (
          SELECT
            DATE_TRUNC(data, MONTH) AS month,
            SUM(vendas_brutas_brl)       AS gross_sales,
            SUM(custo_alimentos_brl)     AS food_cost,
            SUM(custo_mao_obra_brl)      AS labor_cost,
            SUM(despesa_promocional_brl) AS promo_cost
          FROM \`${projectId}.${datasetId}.${integTable}\`
          WHERE restaurant_id = @restaurantId
            AND data BETWEEN
              PARSE_DATE('%Y-%m-%d', @startDate)
              AND PARSE_DATE('%Y-%m-%d', @endDate)
          GROUP BY month
        ),
        delivery AS (
          SELECT
            DATE_TRUNC(data, MONTH) AS month,
            SUM(total_brl) AS delivery_revenue
          FROM \`${projectId}.${datasetId}.${delivTable}\`
          WHERE restaurant_id = @restaurantId
            AND data BETWEEN
              PARSE_DATE('%Y-%m-%d', @startDate)
              AND PARSE_DATE('%Y-%m-%d', @endDate)
          GROUP BY month
        ),
        monthly_data AS (
          SELECT
            COALESCE(i.month, d.month, s.month) AS month,
            COALESCE(i.gross_sales,     0) AS gross_sales,
            COALESCE(d.delivery_revenue,0) AS delivery_revenue,
            COALESCE(s.stock_cost,      0) AS stock_cost,
            COALESCE(i.food_cost,       0) AS food_cost,
            COALESCE(i.labor_cost,      0) AS labor_cost,
            COALESCE(i.promo_cost,      0) AS promo_cost
          FROM integrated i
          FULL OUTER JOIN delivery d ON i.month = d.month
          FULL OUTER JOIN stock_usage s ON i.month = s.month
        )
  
      SELECT
        month,
        gross_sales,
        delivery_revenue,
        (gross_sales + delivery_revenue) AS total_revenue,
        (food_cost + stock_cost)         AS variable_costs,
        (labor_cost + promo_cost)        AS fixed_costs,
  
        /* Margem de contribuição (%) */
        ((gross_sales + delivery_revenue)
          - (food_cost + stock_cost)
        ) / NULLIF((gross_sales + delivery_revenue), 0)
          AS contribution_margin_ratio,
  
        /* Receita TOTAL necessária para atingir o break-even */
        (labor_cost + promo_cost)
          / NULLIF(
              1
              - ((food_cost + stock_cost)
                 / NULLIF((gross_sales + delivery_revenue), 0)
                ),
              0
            )
        AS break_even_revenue
  
      FROM monthly_data
      ORDER BY month DESC;
    `;
  
    const options = {
      query,
      params: { restaurantId, startDate, endDate }
    };
  
    try {
      const [rows] = await bigquery.query(options);
      return rows as any[];
    } catch (err) {
      console.error("Erro ao buscar dados de break-even:", err);
      throw err;
    }
  }
  
  
  export async function getTransactionsData(
    restaurantId: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID!;
    const dataset = process.env.GOOGLE_DATASET_SQL || "foodatlas_bucket";
    
    // Usar as tabelas definidas no .env
    const stockTable = process.env.BIGQUERY_TABLE_STOCK_CONTROL!;
    const integTable = process.env.BIGQUERY_TABLE_INTEGRATED_REPORT!;
    const delivTable = process.env.BIGQUERY_TABLE_DELIVERY_REPORT!;
    
    // Consulta adaptada para usar as três tabelas e simular transações
    const query = `
      WITH
        integrated AS (
          SELECT
            CONCAT('INT_', CAST(RAND() * 1000000 AS INT64)) AS transaction_id,
            restaurant_id,
            CONCAT('CLIENT_', CAST(RAND() * 10000 AS INT64)) AS client_id,
            data AS date,
            vendas_brutas_brl AS amount,
            'RECEITA' AS transaction_type
          FROM
            \`${projectId}.${dataset}.${integTable}\`
          WHERE
            restaurant_id = @restaurantId
            AND data BETWEEN DATE(@startDate) AND DATE(@endDate)
        ),
        delivery AS (
          SELECT
            CONCAT('DEL_', CAST(RAND() * 1000000 AS INT64)) AS transaction_id,
            restaurant_id,
            CONCAT('CLIENT_', CAST(RAND() * 10000 AS INT64)) AS client_id,
            data AS date,
            total_brl AS amount,
            'RECEITA' AS transaction_type
          FROM
            \`${projectId}.${dataset}.${delivTable}\`
          WHERE
            restaurant_id = @restaurantId
            AND data BETWEEN DATE(@startDate) AND DATE(@endDate)
        )
      SELECT * FROM integrated
      UNION ALL
      SELECT * FROM delivery
      ORDER BY date DESC
    `;
    
    const options = {
      query,
      params: { restaurantId, startDate, endDate }
    };
    
    try {
      const [rows] = await bigquery.query(options);
      return rows as any[];
    } catch (err) {
      console.error("[GET_TRANSACTIONS] Erro ao buscar transações:", err);
      throw err;
    }
  }
  
  export async function getCostControlData(
    restaurantId: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    const projectId  = process.env.GOOGLE_CLOUD_PROJECT_ID!;
    const datasetId  = process.env.BIGQUERY_DATASET!;
    const stockTable = process.env.BIGQUERY_TABLE_STOCK_CONTROL!;
    const integTable = process.env.BIGQUERY_TABLE_INTEGRATED_REPORT!;
  
    const query = `
      WITH
        stock_usage AS (
          SELECT
            DATE_TRUNC(data, MONTH) AS month,
            SUM(qtd_usada_unidades * custo_unitario_brl) AS stock_cost,
            AVG(custo_unitario_brl) AS avg_unit_cost,
            SUM(qtd_usada_unidades) AS total_units_used
          FROM \`${projectId}.${datasetId}.${stockTable}\`
          WHERE restaurant_id = @restaurantId
            AND data BETWEEN
              PARSE_DATE('%Y-%m-%d', @startDate)
              AND PARSE_DATE('%Y-%m-%d', @endDate)
          GROUP BY month
        ),
        integrated AS (
          SELECT
            DATE_TRUNC(data, MONTH) AS month,
            SUM(custo_alimentos_brl)     AS food_cost,
            SUM(custo_mao_obra_brl)      AS labor_cost,
            SUM(despesa_promocional_brl) AS promo_cost,
            AVG(custo_alimentos_brl)     AS avg_food_cost,
            AVG(custo_mao_obra_brl)      AS avg_labor_cost,
            AVG(despesa_promocional_brl) AS avg_promo_cost
          FROM \`${projectId}.${datasetId}.${integTable}\`
          WHERE restaurant_id = @restaurantId
            AND data BETWEEN
              PARSE_DATE('%Y-%m-%d', @startDate)
              AND PARSE_DATE('%Y-%m-%d', @endDate)
          GROUP BY month
        ),
        monthly_costs AS (
          SELECT
            COALESCE(i.month, s.month) AS month,
            COALESCE(s.stock_cost,      0) AS stock_cost,
            COALESCE(i.food_cost,       0) AS food_cost,
            COALESCE(i.labor_cost,      0) AS labor_cost,
            COALESCE(i.promo_cost,      0) AS promo_cost,
            COALESCE(s.avg_unit_cost,   0) AS avg_unit_cost,
            COALESCE(s.total_units_used,0) AS total_units_used,
            COALESCE(i.avg_food_cost,   0) AS avg_food_cost,
            COALESCE(i.avg_labor_cost,  0) AS avg_labor_cost,
            COALESCE(i.avg_promo_cost,  0) AS avg_promo_cost
          FROM integrated i
          FULL OUTER JOIN stock_usage s ON i.month = s.month
        )
  
      SELECT
        month,
        stock_cost,
        food_cost,
        labor_cost,
        promo_cost,
        (food_cost + stock_cost) AS variable_costs,
        (labor_cost + promo_cost) AS fixed_costs,
        (food_cost + stock_cost + labor_cost + promo_cost) AS total_costs,
        avg_unit_cost,
        total_units_used,
        avg_food_cost,
        avg_labor_cost,
        avg_promo_cost
  
      FROM monthly_costs
      ORDER BY month DESC;
    `;
  
    const options = {
      query,
      params: { restaurantId, startDate, endDate }
    };
  
    try {
      const [rows] = await bigquery.query(options);
      return rows as any[];
    } catch (err) {
      console.error("Erro ao buscar dados de controle de custos:", err);
      throw err;
    }
  }
  