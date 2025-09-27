import { StatusBar, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChatScreen(){
    return (
        <SafeAreaView>
            <StatusBar barStyle={"light-content"} />
                <View>
                    <Text>Chat History</Text>
                </View>
        </SafeAreaView>
    )
}