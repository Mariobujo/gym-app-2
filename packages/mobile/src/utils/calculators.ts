/**
 * Calculate Body Mass Index (BMI)
 * @param weightKg - Weight in kilograms
 * @param heightCm - Height in centimeters
 * @returns BMI value
 */
  export const calculateBMI = (weightKg: number, heightCm: number): number => {
    // Convert height to meters
    const heightM = heightCm / 100;
    // BMI formula: weight (kg) / height^2 (m)
    const bmi = weightKg / (heightM * heightM);
    return parseFloat(bmi.toFixed(1));
  };
  
  /**
   * Get BMI category based on BMI value
   * @param bmi - BMI value
   * @returns BMI category description
   */
  export const getBMICategory = (bmi: number): string => {
    if (bmi < 18.5) {
      return 'Underweight';
    } else if (bmi < 25) {
      return 'Normal weight';
    } else if (bmi < 30) {
      return 'Overweight';
    } else if (bmi < 35) {
      return 'Obesity Class I';
    } else if (bmi < 40) {
      return 'Obesity Class II';
    } else {
      return 'Obesity Class III';
    }
  };
  
  /**
   * Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
   * @param weightKg - Weight in kilograms
   * @param heightCm - Height in centimeters
   * @param ageYears - Age in years
   * @param isMale - Gender (true for male, false for female)
   * @returns BMR value in calories per day
   */
  export const calculateBMR = (
    weightKg: number, 
    heightCm: number, 
    ageYears: number, 
    isMale: boolean
  ): number => {
    // Mifflin-St Jeor Equation
    const bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + (isMale ? 5 : -161);
    return Math.round(bmr);
  };
  
  /**
   * Calculate Total Daily Energy Expenditure (TDEE)
   * @param bmr - Basal Metabolic Rate
   * @param activityLevel - Activity level multiplier
   * @returns TDEE value in calories per day
   */
  export const calculateTDEE = (bmr: number, activityLevel: ActivityLevel): number => {
    return Math.round(bmr * getActivityMultiplier(activityLevel));
  };
  
  /**
   * Calculate calorie targets based on goal
   * @param tdee - Total Daily Energy Expenditure
   * @param goal - Fitness goal
   * @returns Object with calorie targets
   */
  export const calculateCalorieTargets = (
    tdee: number, 
    goal: 'weightLoss' | 'maintenance' | 'weightGain'
  ): { calories: number; protein: number; carbs: number; fats: number } => {
    let calories: number;
    
    // Set calories based on goal
    switch (goal) {
      case 'weightLoss':
        calories = tdee - 500; // 500 calorie deficit
        break;
      case 'maintenance':
        calories = tdee;
        break;
      case 'weightGain':
        calories = tdee + 500; // 500 calorie surplus
        break;
    }
    
    // Calculate macronutrients (grams)
    // Protein: 30% of calories
    const protein = Math.round((calories * 0.3) / 4); // 4 calories per gram of protein
    
    // Fats: 30% of calories
    const fats = Math.round((calories * 0.3) / 9); // 9 calories per gram of fat
    
    // Carbs: 40% of calories
    const carbs = Math.round((calories * 0.4) / 4); // 4 calories per gram of carbs
    
    return {
      calories,
      protein,
      carbs,
      fats
    };
  };
  
  /**
   * Calculate One-Rep Max (1RM) using Brzycki formula
   * @param weight - Weight lifted
   * @param reps - Number of reps performed
   * @returns Estimated 1RM
   */
  export const calculateOneRepMax = (weight: number, reps: number): number => {
    if (reps === 0) return 0;
    if (reps === 1) return weight;
    
    // Brzycki formula: weight * (36 / (37 - reps))
    const oneRM = weight * (36 / (37 - reps));
    return Math.round(oneRM);
  };
  
  /**
   * Calculate body fat percentage (Navy Method)
   * @param waistCm - Waist circumference in centimeters
   * @param neckCm - Neck circumference in centimeters
   * @param heightCm - Height in centimeters
   * @param hipsCm - Hip circumference in centimeters (for females)
   * @param isMale - Gender (true for male, false for female)
   * @returns Estimated body fat percentage
   */
  export const calculateBodyFat = (
    waistCm: number,
    neckCm: number,
    heightCm: number,
    hipsCm?: number,
    isMale: boolean = true
  ): number => {
    if (isMale) {
      // Men: 86.010 × log10(waist - neck) - 70.041 × log10(height) + 36.76
      const bodyFat = 86.01 * Math.log10(waistCm - neckCm) - 70.041 * Math.log10(heightCm) + 36.76;
      return parseFloat(bodyFat.toFixed(1));
    } else {
      if (!hipsCm) {
        throw new Error('Hip measurement required for female body fat calculation');
      }
      // Women: 163.205 × log10(waist + hips - neck) - 97.684 × log10(height) - 78.387
      const bodyFat = 163.205 * Math.log10(waistCm + hipsCm - neckCm) - 97.684 * Math.log10(heightCm) - 78.387;
      return parseFloat(bodyFat.toFixed(1));
    }
  };
  
  /**
   * Get activity level multiplier
   */
  export enum ActivityLevel {
    SEDENTARY = 'sedentary',           // Little or no exercise
    LIGHTLY_ACTIVE = 'lightlyActive',  // Light exercise 1-3 days/week
    MODERATELY_ACTIVE = 'moderatelyActive', // Moderate exercise 3-5 days/week
    VERY_ACTIVE = 'veryActive',       // Hard exercise 6-7 days/week
    EXTRA_ACTIVE = 'extraActive'      // Very hard exercise, physical job or training twice a day
  }
  
  export const getActivityMultiplier = (activityLevel: ActivityLevel): number => {
    switch (activityLevel) {
      case ActivityLevel.SEDENTARY:
        return 1.2;
      case ActivityLevel.LIGHTLY_ACTIVE:
        return 1.375;
      case ActivityLevel.MODERATELY_ACTIVE:
        return 1.55;
      case ActivityLevel.VERY_ACTIVE:
        return 1.725;
      case ActivityLevel.EXTRA_ACTIVE:
        return 1.9;
      default:
        return 1.2;
    }
  };
  
  export default {
    calculateBMI,
    getBMICategory,
    calculateBMR,
    calculateTDEE,
    calculateCalorieTargets,
    calculateOneRepMax,
    calculateBodyFat,
    ActivityLevel,
    getActivityMultiplier
  };