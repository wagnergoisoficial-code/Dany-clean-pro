# Security Specification - Dany Clean Pro

## Data Invariants
1. **Settings**: Publicly readable. Only admins can write.
2. **Reviews**: Publicly readable if `isPublished == true`. Anyone can create (as feedback), but only admins can update/delete.
3. **Gallery**: Publicly readable. Only admins can write.
4. **Leads**: Anyone can create. Only admins can list/read/update/delete.
5. **Admins**: Only admins can read/write.

## The Dirty Dozen (Payloads to Reject)

1. **Identity Spoofing**: User A trying to update a Lead they didn't create (though Leads are admin-only anyway).
2. **Resource Poisoning**: Document IDs longer than 128 characters or containing weird characters.
3. **System Field Injection**: Trying to set `status: "completed"` on a Lead creation (should default to "new").
4. **Large String Attack**: Setting a Review comment to 1MB of junk.
5. **Type Poisoning**: Setting `rating` to a string instead of a number.
6. **Setting Overwrite**: Regular user trying to change the `app_logo`.
7. **Lead Listing**: Unauthenticated user trying to list all current Leads.
8. **Review Spoofing**: Submitting a Review with `isPublished: true` (should default to `false` or be admin-only to set true).
9. **Gallery Injection**: Regular user trying to add an image to the gallery.
10. **Admin Privilege Escalation**: User trying to create a document in `/admins/`.
11. **Negative Rating**: Setting a Review rating to -5.
12. **Future Leads**: Setting `createdAt` to a future date instead of `request.time`.

## Test Runner (firestore.rules.test.ts snippet)
- `getDoc(settings/app_logo)` -> ALLOW
- `updateDoc(settings/app_logo, {value: 'hacked'})` -> DENY (unauthenticated)
- `addDoc(collection(leads), {name: 'Test', status: 'completed'})` -> DENY (status must be 'new' or use server-side default)
- `getDocs(collection(leads))` -> DENY (unauthenticated)
