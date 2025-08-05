const { google } = require('googleapis');

class GoogleReviewsService {
  constructor(accessToken) {
    this.auth = new google.auth.OAuth2();
    this.auth.setCredentials({ access_token: accessToken });
    console.log('🔧 Google Reviews Service initialized');
  }

  async getAccounts() {
    try {
      console.log('📋 Fetching Google My Business accounts...');
      const mybusiness = google.mybusinessaccountmanagement({ 
        version: 'v1', 
        auth: this.auth 
      });
      
      const response = await mybusiness.accounts.list();
      const accounts = response.data.accounts || [];
      console.log(`✅ Found ${accounts.length} Google My Business accounts`);
      return accounts;
    } catch (error) {
      console.error('❌ Error fetching Google accounts:', error.message);
      return [];
    }
  }

  async getLocations(accountName) {
    try {
      console.log('📍 Fetching locations for account:', accountName);
      const mybusiness = google.mybusinessbusinessinformation({ 
        version: 'v1', 
        auth: this.auth 
      });
      
      const response = await mybusiness.accounts.locations.list({
        parent: accountName
      });
      
      const locations = response.data.locations || [];
      console.log(`✅ Found ${locations.length} locations`);
      return locations;
    } catch (error) {
      console.error('❌ Error fetching Google locations:', error.message);
      return [];
    }
  }

  async getReviews(locationName) {
    try {
      console.log('⭐ Fetching reviews for location:', locationName);
      const mybusiness = google.mybusinessbusinessinformation({ 
        version: 'v1', 
        auth: this.auth 
      });
      
      const response = await mybusiness.locations.reviews.list({
        parent: locationName,
        pageSize: 50
      });
      
      const reviews = response.data.reviews?.map(review => ({
        id: review.name,
        platform: 'google',
        customerName: review.reviewer?.displayName || 'Anonymous',
        rating: review.starRating,
        text: review.comment || '',
        date: new Date(review.createTime).toISOString().split('T')[0],
        replied: !!review.reply,
        reply: review.reply?.comment || null,
        avatar: (review.reviewer?.displayName || 'A').charAt(0).toUpperCase()
      })) || [];
      
      console.log(`✅ Found ${reviews.length} reviews`);
      return reviews;
    } catch (error) {
      console.error('❌ Error fetching Google reviews:', error.message);
      return [];
    }
  }

  async replyToReview(reviewName, replyText) {
    try {
      console.log('💬 Posting reply to Google review:', reviewName);
      const mybusiness = google.mybusinessbusinessinformation({ 
        version: 'v1', 
        auth: this.auth 
      });
      
      const response = await mybusiness.locations.reviews.reply({
        name: reviewName,
        requestBody: {
          comment: replyText
        }
      });
      
      console.log('✅ Google review reply posted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error replying to Google review:', error.message);
      throw error;
    }
  }
}

module.exports = GoogleReviewsService;