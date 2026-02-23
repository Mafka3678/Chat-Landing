
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export const validateNiche = (niche: string): ValidationResult => {
  if (!niche || niche.trim().length < 2) {
    return { isValid: false, errorMessage: "Пожалуйста, укажите корректную нишу (минимум 2 символа)." };
  }
  return { isValid: true };
};

export const validateBudget = (budget: string): ValidationResult => {
  if (!budget || budget.trim().length === 0) {
    return { isValid: false, errorMessage: "Пожалуйста, укажите ваш бюджет." };
  }
  return { isValid: true };
};

export const validatePlans = (plans: string): ValidationResult => {
  if (!plans || plans.trim().length < 3) {
    return { isValid: false, errorMessage: "Пожалуйста, опишите ваши планы чуть подробнее." };
  }
  return { isValid: true };
};

export const validateName = (name: string): ValidationResult => {
  if (!name || name.trim().length < 2) {
    return { isValid: false, errorMessage: "Пожалуйста, введите корректное имя." };
  }
  // Simple check to ensure it doesn't contain only numbers or special chars if needed, 
  // but for now length check is a good start.
  return { isValid: true };
};

export const validatePhone = (phone: string): ValidationResult => {
  // Remove non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Basic check: length between 7 and 15 digits
  if (cleanPhone.length < 7 || cleanPhone.length > 15) {
    return { isValid: false, errorMessage: "Пожалуйста, введите корректный номер телефона." };
  }
  return { isValid: true };
};
