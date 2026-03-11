import React from 'react';
import GenericFormManager from './GenericFormManager';

export const EnquiriesManager = () => <GenericFormManager title="Enquiries & Join Requests" type="enquiry" />;
export const ClassBookingsManager = () => <GenericFormManager title="Group Class Bookings" type="group-class" />;
export const PTSessionsManager = () => <GenericFormManager title="Personal Training Sessions" type="pt-session" />;
export const FeedbackManager = () => <GenericFormManager title="Feedback Submissions" type="feedback" />;
export const DocumentsManager = () => (
    <div className="space-y-6">
        <GenericFormManager title="PAR-Q Forms" type="par-q" />
        <br />
        <GenericFormManager title="Trial Waivers" type="trial-waiver" />
        <br />
        <GenericFormManager title="PT Contracts" type="pt-contract" />
    </div>
);
