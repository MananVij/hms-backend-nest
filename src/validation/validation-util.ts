export class PrescriptionValidator {
  static validatePrescriptionData(data: any): any {
    const defaultPrescription = {
      diagnosis: '',
      history: '',
      name: '',
      age: 0,
      sex: '',
      medication: [],
      test_suggested: '',
      test_results: '',
      medical_notes: '',
    };

    const defaultMedication = {
      medicine_name: '',
      dosage: 0,
      days: 0,
      is_sos: false,
      food: {
        before_breakfast: false,
        after_breakfast: false,
        lunch: false,
        dinner: false,
      },
      frequency: {
        od: false,
        bid: false,
        tid: false,
        qid: false,
        hs: false,
        ac: false,
        pc: false,
      },
    };

    // Merge prescription-level defaults
    const validatedData = { ...defaultPrescription, ...data };

    // Validate and apply defaults to medication array
    validatedData.medication = (data.medication || []).map((med: any) => ({
      ...defaultMedication,
      ...med,
      food: { ...defaultMedication.food, ...med.food },
      frequency: { ...defaultMedication.frequency, ...med.frequency },
    }));

    return validatedData;
  }
}