import numpy as np
from scipy.stats import norm


def simulate_var(
    returns_matrix: np.ndarray,
    num_simulations: int = 10000,
    confidence_level: float = 0.95,
    portfolio_value: float = 1000.0,
) -> dict:
    agg_returns = returns_matrix.mean(axis=1)
    mean = float(agg_returns.mean())
    std_dev = float(agg_returns.std())

    simulated = np.random.normal(loc=mean, scale=std_dev, size=num_simulations)
    sorted_returns = np.sort(simulated)
    var_idx = int((1 - confidence_level) * num_simulations)
    mc_var = float(sorted_returns[var_idx])

    cov_matrix = np.cov(returns_matrix, rowvar=False)
    L = np.linalg.cholesky(cov_matrix)
    n_assets = returns_matrix.shape[1]
    random_normals = norm.rvs(size=(num_simulations, n_assets))
    cholesky_sim = random_normals @ L.T
    cholesky_portfolio = cholesky_sim.mean(axis=1)
    sorted_cholesky = np.sort(cholesky_portfolio)
    chol_var = float(sorted_cholesky[var_idx])

    return {
        "monte_carlo_var": mc_var,
        "monte_carlo_var_dollar": portfolio_value * mc_var,
        "cholesky_var": chol_var,
        "cholesky_var_dollar": portfolio_value * chol_var,
        "simulated_returns": simulated.tolist(),
        "cholesky_returns": cholesky_portfolio.tolist(),
    }
