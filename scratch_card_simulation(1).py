import numpy as np
import pandas as pd
import matplotlib.pyplot as plt


# =========================================================
# Config
# =========================================================
N_USERS = 1000000
INITIAL_DIAMONDS = 2000
DIAMONDS_PER_SCRATCH = 1500     # 1150 diamonds = 1 scratch / unlock
DIAMONDS_MULTIPLIER = 1000      # reward value x 1000
ADOPTION_LIMIT = 10             # first 10 scratches use Adoption stage
RANDOM_SEED = 42

# optional safety cap to avoid very long loops in extreme lucky paths
MAX_SCRATCH_CAP = 10000


# =========================================================
# Hard-coded probability model
# First 10 scratches: adoption
# 11th scratch onwards: mature
# =========================================================
PROBABILITY_MODEL = {
    "adoption": {
        "stage_card_drop_rate": {
            "common": 0.60,
            "rare": 0.20,
            "super_rare": 0.15,
            "super_super_rare": 0.03,
            "legendary": 0.02,
        },
        "reward_distribution": {
            "common": {
                0: 0.2099,
                1: 0.3900,
                2: 0.2400,
                3: 0.1000,
                4: 0.0600,
                5: 0.0000,
                6: 0.0000,
                7: 0.0000,
                8: 0.0000,
                9: 0.0000,
                10: 0.0001,
            },
            "rare": {
                0: 0.1910,
                1: 0.3020,
                2: 0.3950,
                3: 0.0940,
                4: 0.0000,
                5: 0.0050,
                6: 0.0050,
                7: 0.0050,
                8: 0.0030,
                9: 0.0000,
                10: 0.0000,
            },
            "super_rare": {
                0: 0.2000,
                1: 0.2200,
                2: 0.2550,
                3: 0.1000,
                4: 0.0550,
                5: 0.0340,
                6: 0.0340,
                7: 0.0340,
                8: 0.0340,
                9: 0.0340,
                10: 0.0000,
            },
            "super_super_rare": {
                0: 0.0000,
                1: 0.2400,
                2: 0.3600,
                3: 0.0000,
                4: 0.1500,
                5: 0.1500,
                6: 0.0400,
                7: 0.0400,
                8: 0.0100,
                9: 0.0100,
                10: 0.0100,
            },
            "legendary": {
                0: 0.1000,
                1: 0.4900,
                2: 0.0700,
                3: 0.1400,
                4: 0.0000,
                5: 0.1500,
                6: 0.0500,
                7: 0.0000,
                8: 0.0000,
                9: 0.0000,
                10: 0.0000,
            },
        },
    },

    "mature": {
        "stage_card_drop_rate": {
            "common": 0.6360,
            "rare": 0.2000,
            "super_rare": 0.1257,
            "super_super_rare": 0.0250,
            "legendary": 0.0133,
        },
        "reward_distribution": {
            "common": {
                0: 0.5030,
                1: 0.3000,
                2: 0.1890,
                3: 0.0010,
                4: 0.0010,
                5: 0.0010,
                6: 0.0010,
                7: 0.0010,
                8: 0.0010,
                9: 0.0010,
                10: 0.0010,
            },
            "rare": {
                0: 0.4760,
                1: 0.2500,
                2: 0.2600,
                3: 0.0070,
                4: 0.0010,
                5: 0.0010,
                6: 0.0010,
                7: 0.0010,
                8: 0.0010,
                9: 0.0010,
                10: 0.0010,
            },
            "super_rare": {
                0: 0.4760,
                1: 0.1290,
                2: 0.2800,
                3: 0.0800,
                4: 0.0050,
                5: 0.0050,
                6: 0.0050,
                7: 0.0050,
                8: 0.0050,
                9: 0.0050,
                10: 0.0050,
            },
            "super_super_rare": {
                0: 0.0000,
                1: 0.1000,
                2: 0.3250,
                3: 0.1250,
                4: 0.1100,
                5: 0.1500,
                6: 0.1500,
                7: 0.0100,
                8: 0.0100,
                9: 0.0100,
                10: 0.0100,
            },
            "legendary": {
                0: 0.0000,
                1: 0.3000,
                2: 0.1250,
                3: 0.1250,
                4: 0.1300,
                5: 0.1300,
                6: 0.0300,
                7: 0.0300,
                8: 0.0300,
                9: 0.0100,
                10: 0.0900,
            },
        },
    },
}


# =========================================================
# Validation
# =========================================================
def validate_probability_dict(prob_dict, name="probability_dict", tolerance=1e-6):
    total = sum(prob_dict.values())
    if abs(total - 1.0) > tolerance:
        raise ValueError(f"{name} does not sum to 1.0. Current total = {total:.10f}")


def validate_model(model):
    for stage_name, stage_info in model.items():
        validate_probability_dict(
            stage_info["stage_card_drop_rate"],
            name=f"{stage_name}.stage_card_drop_rate"
        )
        for card_name, reward_probs in stage_info["reward_distribution"].items():
            validate_probability_dict(
                reward_probs,
                name=f"{stage_name}.{card_name}.reward_distribution"
            )


# =========================================================
# Sampling helpers
# =========================================================
def weighted_random_choice(prob_dict, rng):
    values = list(prob_dict.keys())
    probs = list(prob_dict.values())
    return rng.choice(values, p=probs)


def get_stage_by_scratch_number(scratch_number, adoption_limit=ADOPTION_LIMIT):
    """
    scratch_number starts from 1
    1 ~ 10   -> adoption
    11 onward -> mature
    """
    return "adoption" if scratch_number <= adoption_limit else "mature"


def simulate_one_scratch(scratch_number, model, rng):
    stage = get_stage_by_scratch_number(scratch_number)
    stage_info = model[stage]

    card_type = weighted_random_choice(stage_info["stage_card_drop_rate"], rng)
    reward_unit = weighted_random_choice(stage_info["reward_distribution"][card_type], rng)
    reward_diamonds = reward_unit * DIAMONDS_MULTIPLIER

    return {
        "scratch_number": scratch_number,
        "stage": stage,
        "card_type": card_type,
        "reward_unit": reward_unit,
        "reward_diamonds": reward_diamonds,
    }


# =========================================================
# Core simulation logic
# =========================================================
def simulate_one_user(user_id, model, rng, max_scratch_cap=MAX_SCRATCH_CAP):
    """
    Logic:
    - user starts with INITIAL_DIAMONDS
    - each scratch costs DIAMONDS_PER_SCRATCH diamonds
    - if remaining diamonds < DIAMONDS_PER_SCRATCH, user stops
    - reward diamonds from scratch are added back
    - continue until user can no longer afford next scratch
    """

    current_diamonds = INITIAL_DIAMONDS
    scratch_count = 0
    scratch_rows = []

    while current_diamonds >= DIAMONDS_PER_SCRATCH and scratch_count < max_scratch_cap:
        # spend one scratch cost first
        current_diamonds -= DIAMONDS_PER_SCRATCH
        scratch_count += 1

        # simulate reward
        scratch_result = simulate_one_scratch(scratch_count, model, rng)
        current_diamonds += scratch_result["reward_diamonds"]

        scratch_rows.append({
            "user_id": user_id,
            "scratch_number": scratch_result["scratch_number"],
            "stage": scratch_result["stage"],
            "card_type": scratch_result["card_type"],
            "reward_unit": scratch_result["reward_unit"],
            "reward_diamonds": scratch_result["reward_diamonds"],
            "diamonds_after_scratch": current_diamonds,
        })

    summary_row = {
        "user_id": user_id,
        "initial_diamonds": INITIAL_DIAMONDS,
        "max_scratch_count": scratch_count,
        "ending_diamonds": current_diamonds,
        "ended_by_cap": scratch_count >= max_scratch_cap,
    }

    return summary_row, scratch_rows


def run_simulation(n_users, model, seed=RANDOM_SEED):
    rng = np.random.default_rng(seed)

    user_summaries = []
    scratch_details = []

    for user_id in range(1, n_users + 1):
        summary_row, scratch_rows = simulate_one_user(user_id=user_id, model=model, rng=rng)
        user_summaries.append(summary_row)
        scratch_details.extend(scratch_rows)

    user_df = pd.DataFrame(user_summaries)
    scratch_df = pd.DataFrame(scratch_details)

    return user_df, scratch_df


# =========================================================
# Summary
# =========================================================
def summarise_results(user_df):
    max_scratch_series = user_df["max_scratch_count"]

    summary = {
        "n_users": len(user_df),
        "avg_max_scratches": max_scratch_series.mean(),
        "median_max_scratches": max_scratch_series.median(),
        "p75_max_scratches": max_scratch_series.quantile(0.75),
        "p90_max_scratches": max_scratch_series.quantile(0.90),
        "p95_max_scratches": max_scratch_series.quantile(0.95),
        "p99_max_scratches": max_scratch_series.quantile(0.99),
        "min_max_scratches": max_scratch_series.min(),
        "max_max_scratches": max_scratch_series.max(),
        "avg_ending_diamonds": user_df["ending_diamonds"].mean(),
    }

    print("=" * 60)
    print("Simulation Summary")
    print("=" * 60)
    print(f"Total simulated users: {summary['n_users']:,}")
    print(f"Initial diamonds per user: {INITIAL_DIAMONDS:,}")
    print(f"Scratch cost: {DIAMONDS_PER_SCRATCH:,} diamonds per scratch")
    print()
    print(f"Average max scratches: {summary['avg_max_scratches']:.2f}")
    print(f"Median max scratches (P50): {summary['median_max_scratches']:.2f}")
    print(f"P75 max scratches: {summary['p75_max_scratches']:.2f}")
    print(f"P90 max scratches: {summary['p90_max_scratches']:.2f}")
    print(f"P95 max scratches: {summary['p95_max_scratches']:.2f}")
    print(f"P99 max scratches: {summary['p99_max_scratches']:.2f}")
    print(f"Min max scratches: {summary['min_max_scratches']}")
    print(f"Max max scratches: {summary['max_max_scratches']}")
    print(f"Average ending diamonds: {summary['avg_ending_diamonds']:.2f}")
    print("=" * 60)

    return summary


# =========================================================
# Plotting
# =========================================================
def plot_histogram(user_df):
    plt.figure(figsize=(10, 6))
    plt.hist(user_df["max_scratch_count"], bins=40, edgecolor="black")
    plt.title("Histogram of Maximum Scratch Count per User")
    plt.xlabel("Maximum number of scratches")
    plt.ylabel("Number of users")
    plt.tight_layout()
    plt.show()


def plot_cdf(user_df):
    sorted_values = np.sort(user_df["max_scratch_count"].values)
    cdf = np.arange(1, len(sorted_values) + 1) / len(sorted_values)

    plt.figure(figsize=(10, 6))
    plt.plot(sorted_values, cdf)
    plt.title("CDF of Maximum Scratch Count per User")
    plt.xlabel("Maximum number of scratches")
    plt.ylabel("Cumulative proportion")
    plt.tight_layout()
    plt.show()


def plot_stage_reach_bar(user_df):
    adoption_only = (user_df["max_scratch_count"] <= ADOPTION_LIMIT).sum()
    reached_mature = (user_df["max_scratch_count"] >= ADOPTION_LIMIT + 1).sum()

    labels = ["Stopped within Adoption", "Reached Mature stage"]
    values = [adoption_only, reached_mature]

    plt.figure(figsize=(8, 6))
    bars = plt.bar(labels, values)
    plt.title("Users Who Stayed in Adoption vs Reached Mature")
    plt.ylabel("Number of users")

    for bar, value in zip(bars, values):
        plt.text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height(),
            f"{value:,}",
            ha="center",
            va="bottom"
        )

    plt.tight_layout()
    plt.show()


# =========================================================
# Optional extra table for distribution buckets
# =========================================================
def build_distribution_table(user_df):
    bins = [-1, 0, 1, 2, 3, 5, 10, 24, 50, 100, np.inf]
    labels = [
        "0",
        "1",
        "2",
        "3",
        "4-5",
        "6-10",
        "11-24",
        "25-50",
        "51-100",
        "100+"
    ]

    bucketed = pd.cut(user_df["max_scratch_count"], bins=bins, labels=labels)
    dist_table = (
        bucketed.value_counts(sort=False)
        .rename_axis("max_scratch_bucket")
        .reset_index(name="user_count")
    )
    dist_table["user_ratio"] = dist_table["user_count"] / dist_table["user_count"].sum()

    return dist_table


# =========================================================
# Main
# =========================================================
def main():
    validate_model(PROBABILITY_MODEL)

    user_df, scratch_df = run_simulation(
        n_users=N_USERS,
        model=PROBABILITY_MODEL,
        seed=RANDOM_SEED
    )

    summary = summarise_results(user_df)

    dist_table = build_distribution_table(user_df)

    print("\nUser-level sample:")
    print(user_df.head())

    print("\nScratch-level sample:")
    print(scratch_df.head(10))

    print("\nDistribution table:")
    print(dist_table)

    plot_histogram(user_df)
    plot_cdf(user_df)
    plot_stage_reach_bar(user_df)

    return user_df, scratch_df, dist_table, summary


if __name__ == "__main__":
    user_df, scratch_df, dist_table, summary = main()
