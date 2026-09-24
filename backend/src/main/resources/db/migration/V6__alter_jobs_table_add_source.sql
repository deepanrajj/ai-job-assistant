-- track where a saved job came from (LinkedIn, company site, referral, ...)
ALTER TABLE jobs ADD COLUMN source VARCHAR(50);
