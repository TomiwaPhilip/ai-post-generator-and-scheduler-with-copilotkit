import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs";

const BasicAuthToken = Buffer.from(
	`${process.env.TWITTER_CLIENT_ID!}:${process.env.TWITTER_CLIENT_SECRET!}`,
	"utf8"
).toString("base64");

const twitterOauthTokenParams = {
	client_id: process.env.TWITTER_CLIENT_ID!,
	code_verifier: "8KxxO-RPl0bLSxX5AWwgdiFbMnry_VOKzFeIlVA7NoA",
	redirect_uri: `http://my-twitter-poster/dashboard`,
	grant_type: "authorization_code",
};

//gets user access token
const fetchUserToken = async (code: string) => {
	try {
		const formatData = new URLSearchParams({
			...twitterOauthTokenParams,
			code,
		});
		const getTokenRequest = await fetch(
			"https://api.twitter.com/2/oauth2/token",
			{
				method: "POST",
				body: formatData.toString(),
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					Authorization: `Basic ${BasicAuthToken}`,
				},
			}
		);
		const getTokenResponse = await getTokenRequest.json();
		return getTokenResponse;
	} catch (err) {
		return null;
	}
};

//gets user's data from the access token
const fetchUserData = async (accessToken: string) => {
	try {
		const getUserRequest = await fetch("https://api.twitter.com/2/users/me", {
			headers: {
				"Content-type": "application/json",
				Authorization: `Bearer ${accessToken}`,
			},
		});
		const getUserProfile = await getUserRequest.json();
		return getUserProfile;
	} catch (err) {
		return null;
	}
};

export async function POST(req: NextRequest) {
	const { code } = await req.json();
	try {
		//👇🏻 get access token and the entire response
		const tokenResponse = await fetchUserToken(code);
		const accessToken = await tokenResponse.access_token;
		//👇🏻 get user data
		const userDataResponse = await fetchUserData(accessToken);
		const userCredentials = { ...tokenResponse, ...userDataResponse };

		//👇🏻  merge the user's access token, id, and username into an object
		const userData = {
			accessToken: userCredentials.access_token,
			_id: userCredentials.data.id,
			username: userCredentials.data.username,
		};
		//👇🏻 store them in a JSON file (for server-use)
		writeFile("./src/user.json", JSON.stringify(userData, null, 2), (error) => {
			if (error) {
				console.log("An error has occurred ", error);
				throw error;
			}
			console.log("Data written successfully to disk");
		});
		//👇🏻 returns a successful response
		return NextResponse.json(
			{
				data: "User data stored successfully",
			},
			{ status: 200 }
		);
	} catch (err) {
		return NextResponse.json({ error: err }, { status: 500 });
	}
}