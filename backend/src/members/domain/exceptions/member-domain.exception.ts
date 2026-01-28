/**
 * Domain Exceptions
 * 
 * Domain katmanı için özel exception'lar.
 * Infrastructure katmanı bu exception'ları yakalayıp HTTP exception'a çevirebilir.
 */
export class MemberCannotBeApprovedException extends Error {
  constructor(
    public readonly currentStatus: string,
  ) {
    super(`Sadece bekleyen (PENDING) durumundaki başvurular onaylanabilir. Mevcut durum: ${currentStatus}`);
    this.name = 'MemberCannotBeApprovedException';
  }
}

export class MemberApprovalMissingFieldsException extends Error {
  constructor(
    public readonly missingFields: string[],
  ) {
    super(
      `Üye bekleme (APPROVED) durumuna geçirilirken aşağıdaki alanlar zorunludur: ${missingFields.join(', ')}. Lütfen eksik bilgileri tamamlayın.`
    );
    this.name = 'MemberApprovalMissingFieldsException';
  }
}

export class MemberNotFoundException extends Error {
  constructor(public readonly memberId: string) {
    super(`Üye bulunamadı: ${memberId}`);
    this.name = 'MemberNotFoundException';
  }
}

export class MemberCannotBeActivatedException extends Error {
  constructor(
    public readonly currentStatus: string,
  ) {
    super(`Sadece onaylanmış (APPROVED) durumundaki üyeler aktifleştirilebilir. Mevcut durum: ${currentStatus}`);
    this.name = 'MemberCannotBeActivatedException';
  }
}

export class MemberActivationMissingFieldsException extends Error {
  constructor(
    public readonly message: string,
    public readonly missingFields?: string[],
  ) {
    super(message);
    this.name = 'MemberActivationMissingFieldsException';
  }
}

export class MemberCannotBeRejectedException extends Error {
  constructor(
    public readonly currentStatus: string,
  ) {
    super(`Sadece bekleyen (PENDING) veya onaylanmış (APPROVED) durumundaki başvurular reddedilebilir. Mevcut durum: ${currentStatus}`);
    this.name = 'MemberCannotBeRejectedException';
  }
}

export class MemberCannotBeCancelledException extends Error {
  constructor(
    public readonly currentStatus: string,
  ) {
    super(`Sadece aktif üyelerin üyeliği iptal edilebilir. Mevcut durum: ${currentStatus}`);
    this.name = 'MemberCannotBeCancelledException';
  }
}

export class MemberCancellationReasonRequiredException extends Error {
  constructor() {
    super('İptal nedeni zorunludur');
    this.name = 'MemberCancellationReasonRequiredException';
  }
}
