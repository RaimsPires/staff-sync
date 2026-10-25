import { Image } from 'expo-image';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatTime } from '@/core/format';
import { useSession } from '@/core/session/session-store';
import { useTheme } from '@/core/theme/theme-provider';
import { radius, spacing } from '@/core/theme/tokens';
import { closeConversation, loadOlder, openConversation, sendMessage, useChat, type ChatAttachment, type ChatMessage, type Draft } from '@/data/chat';
import { BottomSheet, Button, Icon, Text, useToast } from '@/ui';

const MAX_DRAFTS = 6;
const NO_MESSAGES: ChatMessage[] = [];

/** One conversation: messages, and a composer that can attach photos, videos and documents. */
export function ChatThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const me = useSession((s) => s.user);
  const conversation = useChat((s) => s.conversations.find((c) => c.id === id));
  const messages = useChat((s) => s.messages[id] ?? NO_MESSAGES);
  const complete = useChat((s) => s.complete[id]);
  const list = useRef<FlatList<ChatMessage>>(null);
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [sending, setSending] = useState(false);
  const [attachSheet, setAttachSheet] = useState(false);
  const [cameraBlocked, setCameraBlocked] = useState(false);

  useEffect(() => {
    openConversation(id).catch(() => toast.show(t('chat.loadFailed')));
    return () => closeConversation(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const last = messages[messages.length - 1]?.id;
  useEffect(() => {
    if (last) setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
  }, [last]);

  const addDraft = (d: Draft) => setDrafts((x) => (x.length < MAX_DRAFTS ? [...x, d] : x));
  const closeSheet = () => {
    setAttachSheet(false);
    setCameraBlocked(false);
  };
  const fromAsset = (a: ImagePicker.ImagePickerAsset): Draft => ({
    uri: a.uri,
    name: a.fileName ?? (a.type === 'video' ? 'video.mp4' : 'photo.jpg'),
    contentType: a.mimeType ?? (a.type === 'video' ? 'video/mp4' : 'image/jpeg'),
    size: a.fileSize ?? 0,
  });

  const fromCamera = async () => {
    // The camera has its own permission: ask now, and point to Settings when it was refused for good.
    let perm = await ImagePicker.getCameraPermissionsAsync();
    if (!perm.granted && perm.canAskAgain) perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return setCameraBlocked(true);
    closeSheet();
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images', 'videos'], quality: 0.7, videoMaxDuration: 60 });
    if (!res.canceled) addDraft(fromAsset(res.assets[0]));
  };
  // The system picker only hands over what the user chooses, so no photo-library permission is needed.
  const fromGallery = async () => {
    closeSheet();
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 0.7, allowsMultipleSelection: true, selectionLimit: MAX_DRAFTS });
    if (!res.canceled) res.assets.forEach((a) => addDraft(fromAsset(a)));
  };
  const fromFile = async () => {
    closeSheet();
    const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'audio/*'], copyToCacheDirectory: true });
    const f = res.assets?.[0];
    if (f) addDraft({ uri: f.uri, name: f.name, contentType: f.mimeType ?? 'application/pdf', size: f.size ?? 0 });
  };

  const submit = async () => {
    const body = text.trim();
    if ((!body && drafts.length === 0) || sending) return;
    setSending(true);
    try {
      await sendMessage(id, body, drafts);
      setText('');
      setDrafts([]);
    } catch {
      toast.show(t('chat.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  const title = conversation?.title ?? '';
  const sub = conversation?.kind === 'site' ? t('chat.siteGroup', { count: conversation.members ?? 0 }) : conversation?.other?.title ?? '';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.line }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.back')} onPress={() => router.back()} style={styles.back}>
          <Icon name="chevron-back" size={26} />
        </Pressable>
        <View style={styles.flex}>
          <Text variant="subheading" numberOfLines={1}>{title}</Text>
          {sub ? <Text variant="caption" tone="muted" numberOfLines={1}>{sub}</Text> : null}
        </View>
      </View>

      <FlatList
        ref={list}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.messages}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={!complete && messages.length > 0 ? <Button variant="ghost" label={t('chat.older')} onPress={() => void loadOlder(id)} /> : undefined}
        ListEmptyComponent={<Text tone="muted" style={styles.none}>{t('chat.emptyThread')}</Text>}
        renderItem={({ item, index }) => (
          <Bubble m={item} mine={item.sender.id === me?.id} previous={messages[index - 1]} showSender={conversation?.kind === 'site'} />
        )}
      />

      {drafts.length > 0 ? (
        <View style={[styles.drafts, { borderTopColor: colors.line }]}>
          {drafts.map((d, i) => (
            <Pressable key={`${d.uri}-${i}`} accessibilityRole="button" accessibilityLabel={t('chat.removeFile')} onPress={() => setDrafts((x) => x.filter((_, j) => j !== i))} style={[styles.chip, { backgroundColor: colors.soft }]}>
              <Icon name={d.contentType.startsWith('image/') ? 'image-outline' : d.contentType.startsWith('video/') ? 'videocam-outline' : 'document-outline'} size={16} tone="muted" />
              <Text variant="caption" numberOfLines={1} style={styles.chipText}>{d.name}</Text>
              <Icon name="close" size={14} tone="muted" />
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={[styles.composer, { borderTopColor: colors.line, backgroundColor: colors.card, paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('chat.attach')} onPress={() => setAttachSheet(true)} style={styles.iconBtn}>
          <Icon name="attach" size={24} tone="muted" />
        </Pressable>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          maxLength={4000}
          placeholder={t('chat.write')}
          placeholderTextColor={colors.muted}
          accessibilityLabel={t('chat.write')}
          style={[styles.input, { backgroundColor: colors.bg, color: colors.ink, borderColor: colors.fieldBorder }]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('chat.send')}
          disabled={sending || (!text.trim() && drafts.length === 0)}
          onPress={() => void submit()}
          style={[styles.send, { backgroundColor: colors.primary, opacity: sending || (!text.trim() && drafts.length === 0) ? 0.45 : 1 }]}>
          <Icon name="send" size={18} tone="onPrimary" />
        </Pressable>
      </View>

      <BottomSheet visible={attachSheet} onClose={closeSheet} title={t('chat.attach')} closable>
        {cameraBlocked ? (
          <View style={styles.sheetGap}>
            <Text tone="muted">{t('chat.cameraBlocked')}</Text>
            <Button label={t('setup.openSettings')} onPress={() => void Linking.openSettings()} />
            <Button variant="ghost" label={t('chat.fromGallery')} onPress={() => void fromGallery()} />
          </View>
        ) : (
          <View style={styles.sheetGap}>
            <Button variant="outlinePrimary" icon="camera-outline" label={t('chat.fromCamera')} onPress={() => void fromCamera()} />
            <Button variant="outlinePrimary" icon="images-outline" label={t('chat.fromGallery')} onPress={() => void fromGallery()} />
            <Button variant="outlinePrimary" icon="document-outline" label={t('chat.fromFile')} onPress={() => void fromFile()} />
          </View>
        )}
      </BottomSheet>
    </KeyboardAvoidingView>
  );
}

function Bubble({ m, mine, previous, showSender }: { m: ChatMessage; mine: boolean; previous?: ChatMessage; showSender: boolean }) {
  const { colors } = useTheme();
  const grouped = previous?.sender.id === m.sender.id && Date.parse(m.createdAt) - Date.parse(previous.createdAt) < 5 * 60_000;
  return (
    <View style={[styles.bubbleRow, { justifyContent: mine ? 'flex-end' : 'flex-start', marginTop: grouped ? 2 : 10 }]}>
      <View style={[styles.bubble, mine ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.line, borderWidth: 1 }]}>
        {!mine && showSender && !grouped ? <Text variant="label" tone="primary">{m.sender.name}</Text> : null}
        {m.attachments.map((a) => <Media key={a.key} a={a} mine={mine} />)}
        {m.body ? <Text tone={mine ? 'onPrimary' : 'ink'}>{m.body}</Text> : null}
        <Text variant="label" tone={mine ? 'onPrimary' : 'muted'} style={styles.time}>{formatTime(m.createdAt)}</Text>
      </View>
    </View>
  );
}

function Media({ a, mine }: { a: ChatAttachment; mine: boolean }) {
  const { t } = useTranslation();
  if (a.contentType.startsWith('image/')) {
    return (
      <Pressable accessibilityRole="imagebutton" accessibilityLabel={a.name} onPress={() => void Linking.openURL(a.url)}>
        <Image source={{ uri: a.url }} style={styles.image} contentFit="cover" />
      </Pressable>
    );
  }
  const icon = a.contentType.startsWith('video/') ? 'play-circle' : a.contentType.startsWith('audio/') ? 'musical-notes' : 'document-text';
  return (
    <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(a.url)} style={styles.file}>
      <Icon name={icon} size={22} tone={mine ? 'onPrimary' : 'primary'} />
      <Text variant="caption" tone={mine ? 'onPrimary' : 'ink'} numberOfLines={1} style={styles.flex}>
        {a.contentType.startsWith('video/') ? t('chat.video') : a.name}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  messages: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, flexGrow: 1 },
  none: { textAlign: 'center', paddingVertical: spacing.xxxl },
  bubbleRow: { flexDirection: 'row' },
  bubble: { maxWidth: '82%', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, gap: 4 },
  time: { alignSelf: 'flex-end', opacity: 0.8 },
  image: { width: 220, height: 160, borderRadius: 12 },
  file: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 160, paddingVertical: 4 },
  drafts: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, maxWidth: 200 },
  chipText: { flexShrink: 1 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1 },
  iconBtn: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, maxHeight: 120, minHeight: 44, borderRadius: 22, borderWidth: 1, paddingHorizontal: 14, paddingTop: 11, paddingBottom: 11, fontSize: 16 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sheetGap: { gap: spacing.sm, marginTop: spacing.sm },
});
