/**
 * Form submission state stores the following in Redis:
 * Props containing user's submitted values as `{ [inputId]: value }` or as `{ [sectionName]: { [inputName]: value } }`
 *   a) . e.g:
 * ```ts
 *     {
 *       _C9PRHmsgt: 'Ben',
 *       WfLk9McjzX: 'Music',
 *       IK7jkUFCBL: 'Royal Academy of Music'
 *     }
 * ```
 *
 *   b)
 * ```ts
 *   {
 *         checkBeforeYouStart: { ukPassport: true },
 *         applicantDetails: {
 *           numberOfApplicants: 1,
 *           phoneNumber: '77777777',
 *           emailAddress: 'aaa@aaa.com'
 *         },
 *         applicantOneDetails: {
 *           firstName: 'a',
 *           middleName: 'a',
 *           lastName: 'a',
 *           address: { addressLine1: 'a', addressLine2: 'a', town: 'a', postcode: 'a' }
 *         }
 *     }
 * ```
 */

/**
 * Form submission state
 */

/**
 * Form POST for question pages
 * (after Joi has converted value types)
 */

export let UploadStatus = /*#__PURE__*/function (UploadStatus) {
  UploadStatus["initiated"] = "initiated";
  UploadStatus["pending"] = "pending";
  UploadStatus["ready"] = "ready";
  return UploadStatus;
}({});
export let FileStatus = /*#__PURE__*/function (FileStatus) {
  FileStatus["complete"] = "complete";
  FileStatus["rejected"] = "rejected";
  FileStatus["pending"] = "pending";
  return FileStatus;
}({});
//# sourceMappingURL=types.js.map