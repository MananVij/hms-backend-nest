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
        qam: false, // Every morning
        qpm: false, // Every evening
        bs: false, // Before sleep
        q6h: false, // Every 6 hours
        q8h: false, // Every 8 hours
        q12h: false, // Every 12 hours
        qod: false, // Every other day
        q1w: false, // Once a week
        q2w: false, // Twice a week
        q3w: false, // Thrice a week
        q1m: false, // Once a month
      },
      tapering: null,
    };

    const defaultTapering = {
      frequency: '',
      days: 0,
      comments: '',
    };

    // Merge prescription-level defaults
    const validatedData = { ...defaultPrescription, ...data };

    // Validate and apply defaults to medication array
    validatedData.medication = (data.medication || []).map((med: any) => ({
      ...defaultMedication,
      ...med,
      food: { ...defaultMedication.food, ...med.food },
      frequency: { ...defaultMedication.frequency, ...med.frequency },
      tapering:
        med?.tapering && med?.tapering?.length > 0
          ? med.tapering.map((tap: any) => ({
              ...defaultTapering,
              ...tap,
              frequency: typeof tap?.frequency === 'string' ? tap?.frequency : '',
            }))
          : null,
    }));

    return validatedData;
  }
}