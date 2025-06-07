//GET /api/user/

export const getUserData =async(req, res) => {
    try{
        const role = req.user.role;
        const recentSearchedCities = req.user.recentSearchedCities;
        res.json({
          success: true,
          role, // 
          recentSearchedCities
        });
      }catch(error){
        res.json({success: false, message: error.message})        
        
    }
}

// Store User's Recently Searched Cities
export const storeRecentSearchedCities = async (req, res) => {
  try {
    const { recentSearchedCity } = req.body;
    const user = await req.user;

    if (user.recentSearchedCities.length < 3) {
      user.recentSearchedCities.push(recentSearchedCity);
    } else {
      user.recentSearchedCities.shift(); // Remove the oldest entry
      user.recentSearchedCities.push(recentSearchedCity);
    }

    await user.save(); //save updated user data in mongoDB

    res.json({ success: true, message: "City added" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
