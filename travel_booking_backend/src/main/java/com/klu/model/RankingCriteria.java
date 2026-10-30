package com.klu.model;

public enum RankingCriteria {
    BALANCED,     // 30% Risk, 30% Price, 25% Duration, 15% Transfer
    LOWEST_RISK,  // 60% Risk, 20% Transfer, 10% Price, 10% Duration
    FASTEST,      // 50% Duration, 25% Transfer, 15% Risk, 10% Price
    BUDGET        // 55% Price, 20% Risk, 15% Duration, 10% Transfer
}
