export enum MedicalSpecialization {
  // Primary Care
  FAMILY_MEDICINE = 'family_medicine',
  INTERNAL_MEDICINE = 'internal_medicine',
  GENERAL_PRACTICE = 'general_practice',
  
  // Surgical Specialties
  GENERAL_SURGERY = 'general_surgery',
  ORTHOPEDIC_SURGERY = 'orthopedic_surgery',
  NEUROSURGERY = 'neurosurgery',
  PLASTIC_SURGERY = 'plastic_surgery',
  CARDIAC_SURGERY = 'cardiac_surgery',
  THORACIC_SURGERY = 'thoracic_surgery',
  VASCULAR_SURGERY = 'vascular_surgery',
  UROLOGICAL_SURGERY = 'urological_surgery',
  COLON_RECTAL_SURGERY = 'colon_rectal_surgery',
  
  // Medical Specialties
  CARDIOLOGY = 'cardiology',
  NEUROLOGY = 'neurology',
  GASTROENTEROLOGY = 'gastroenterology',
  PULMONOLOGY = 'pulmonology',
  NEPHROLOGY = 'nephrology',
  ENDOCRINOLOGY = 'endocrinology',
  RHEUMATOLOGY = 'rheumatology',
  HEMATOLOGY = 'hematology',
  ONCOLOGY = 'oncology',
  INFECTIOUS_DISEASE = 'infectious_disease',
  GERIATRICS = 'geriatrics',
  PALLIATIVE_CARE = 'palliative_care',
  
  // Pediatric Specialties
  PEDIATRICS = 'pediatrics',
  PEDIATRIC_CARDIOLOGY = 'pediatric_cardiology',
  PEDIATRIC_SURGERY = 'pediatric_surgery',
  PEDIATRIC_NEUROLOGY = 'pediatric_neurology',
  NEONATOLOGY = 'neonatology',
  
  // Women's Health
  OBSTETRICS_GYNECOLOGY = 'obstetrics_gynecology',
  MATERNAL_FETAL_MEDICINE = 'maternal_fetal_medicine',
  REPRODUCTIVE_ENDOCRINOLOGY = 'reproductive_endocrinology',
  
  // Mental Health
  PSYCHIATRY = 'psychiatry',
  CHILD_PSYCHIATRY = 'child_psychiatry',
  ADDICTION_MEDICINE = 'addiction_medicine',
  
  // Diagnostic Specialties
  RADIOLOGY = 'radiology',
  PATHOLOGY = 'pathology',
  NUCLEAR_MEDICINE = 'nuclear_medicine',
  
  // Emergency and Critical Care
  EMERGENCY_MEDICINE = 'emergency_medicine',
  CRITICAL_CARE = 'critical_care',
  ANESTHESIOLOGY = 'anesthesiology',
  
  // Rehabilitation
  PHYSICAL_MEDICINE_REHABILITATION = 'physical_medicine_rehabilitation',
  SPORTS_MEDICINE = 'sports_medicine',
  
  // Specialized Areas
  DERMATOLOGY = 'dermatology',
  OPHTHALMOLOGY = 'ophthalmology',
  OTOLARYNGOLOGY = 'otolaryngology',
  UROLOGY = 'urology',
  ALLERGY_IMMUNOLOGY = 'allergy_immunology',
  PAIN_MANAGEMENT = 'pain_management',
  SLEEP_MEDICINE = 'sleep_medicine',
  OCCUPATIONAL_MEDICINE = 'occupational_medicine',
  PREVENTIVE_MEDICINE = 'preventive_medicine'
}

// Display names for better readability
export const SpecializationDisplayNames: Record<MedicalSpecialization, string> = {
  [MedicalSpecialization.FAMILY_MEDICINE]: 'Family Medicine',
  [MedicalSpecialization.INTERNAL_MEDICINE]: 'Internal Medicine',
  [MedicalSpecialization.GENERAL_PRACTICE]: 'General Practice',
  [MedicalSpecialization.GENERAL_SURGERY]: 'General Surgery',
  [MedicalSpecialization.ORTHOPEDIC_SURGERY]: 'Orthopedic Surgery',
  [MedicalSpecialization.NEUROSURGERY]: 'Neurosurgery',
  [MedicalSpecialization.PLASTIC_SURGERY]: 'Plastic Surgery',
  [MedicalSpecialization.CARDIAC_SURGERY]: 'Cardiac Surgery',
  [MedicalSpecialization.THORACIC_SURGERY]: 'Thoracic Surgery',
  [MedicalSpecialization.VASCULAR_SURGERY]: 'Vascular Surgery',
  [MedicalSpecialization.UROLOGICAL_SURGERY]: 'Urological Surgery',
  [MedicalSpecialization.COLON_RECTAL_SURGERY]: 'Colon & Rectal Surgery',
  [MedicalSpecialization.CARDIOLOGY]: 'Cardiology',
  [MedicalSpecialization.NEUROLOGY]: 'Neurology',
  [MedicalSpecialization.GASTROENTEROLOGY]: 'Gastroenterology',
  [MedicalSpecialization.PULMONOLOGY]: 'Pulmonology',
  [MedicalSpecialization.NEPHROLOGY]: 'Nephrology',
  [MedicalSpecialization.ENDOCRINOLOGY]: 'Endocrinology',
  [MedicalSpecialization.RHEUMATOLOGY]: 'Rheumatology',
  [MedicalSpecialization.HEMATOLOGY]: 'Hematology',
  [MedicalSpecialization.ONCOLOGY]: 'Oncology',
  [MedicalSpecialization.INFECTIOUS_DISEASE]: 'Infectious Disease',
  [MedicalSpecialization.GERIATRICS]: 'Geriatrics',
  [MedicalSpecialization.PALLIATIVE_CARE]: 'Palliative Care',
  [MedicalSpecialization.PEDIATRICS]: 'Pediatrics',
  [MedicalSpecialization.PEDIATRIC_CARDIOLOGY]: 'Pediatric Cardiology',
  [MedicalSpecialization.PEDIATRIC_SURGERY]: 'Pediatric Surgery',
  [MedicalSpecialization.PEDIATRIC_NEUROLOGY]: 'Pediatric Neurology',
  [MedicalSpecialization.NEONATOLOGY]: 'Neonatology',
  [MedicalSpecialization.OBSTETRICS_GYNECOLOGY]: 'Obstetrics & Gynecology',
  [MedicalSpecialization.MATERNAL_FETAL_MEDICINE]: 'Maternal-Fetal Medicine',
  [MedicalSpecialization.REPRODUCTIVE_ENDOCRINOLOGY]: 'Reproductive Endocrinology',
  [MedicalSpecialization.PSYCHIATRY]: 'Psychiatry',
  [MedicalSpecialization.CHILD_PSYCHIATRY]: 'Child Psychiatry',
  [MedicalSpecialization.ADDICTION_MEDICINE]: 'Addiction Medicine',
  [MedicalSpecialization.RADIOLOGY]: 'Radiology',
  [MedicalSpecialization.PATHOLOGY]: 'Pathology',
  [MedicalSpecialization.NUCLEAR_MEDICINE]: 'Nuclear Medicine',
  [MedicalSpecialization.EMERGENCY_MEDICINE]: 'Emergency Medicine',
  [MedicalSpecialization.CRITICAL_CARE]: 'Critical Care',
  [MedicalSpecialization.ANESTHESIOLOGY]: 'Anesthesiology',
  [MedicalSpecialization.PHYSICAL_MEDICINE_REHABILITATION]: 'Physical Medicine & Rehabilitation',
  [MedicalSpecialization.SPORTS_MEDICINE]: 'Sports Medicine',
  [MedicalSpecialization.DERMATOLOGY]: 'Dermatology',
  [MedicalSpecialization.OPHTHALMOLOGY]: 'Ophthalmology',
  [MedicalSpecialization.OTOLARYNGOLOGY]: 'Otolaryngology (ENT)',
  [MedicalSpecialization.UROLOGY]: 'Urology',
  [MedicalSpecialization.ALLERGY_IMMUNOLOGY]: 'Allergy & Immunology',
  [MedicalSpecialization.PAIN_MANAGEMENT]: 'Pain Management',
  [MedicalSpecialization.SLEEP_MEDICINE]: 'Sleep Medicine',
  [MedicalSpecialization.OCCUPATIONAL_MEDICINE]: 'Occupational Medicine',
  [MedicalSpecialization.PREVENTIVE_MEDICINE]: 'Preventive Medicine'
}; 