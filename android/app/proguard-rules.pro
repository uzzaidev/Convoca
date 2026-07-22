# Capacitor bridge — manter classes públicas do bridge JS
-keep class com.getcapacitor.** { *; }
-keep class com.convoca.app.** { *; }

# Firebase / FCM — push notifications
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Preservar informações de debug para stack traces legíveis
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Evitar warnings de bibliotecas internas
-dontwarn com.getcapacitor.**
-dontwarn org.apache.**
