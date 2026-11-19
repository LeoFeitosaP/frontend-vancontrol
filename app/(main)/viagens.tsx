import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    C,
    Panel,
    Pill,
    SectionTitle,
    Shell,
} from "../../components/atelier/ui";
import { useAuth } from "../../hooks/useAuth";
import {
    formatLocalTimeInput,
    isValidLocalTime,
    viagensService,
} from "../../services/api";

function formatDateToBR(date: Date | null): string {
  if (!date) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatDateToAPI(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${year}-${month}-${day}`;
}

// Converte string YYYY-MM-DD (do <input type="date"> na Web) para objeto Date sem erro de fuso
function parseAPIDateToLocal(isoDate: string): Date | null {
  if (!isoDate) return null;
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function formatISOStringToBR(isoDate?: string): string {
  if (!isoDate) return "Data não informada";
  const [datePart] = isoDate.split("T");
  const parts = datePart.split("-");
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function ViagensScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [associatedItems, setAssociatedItems] = useState<any[]>([]);
  const [associatedLoading, setAssociatedLoading] = useState(false);
  const [associatedError, setAssociatedError] = useState("");

  const [codigoRota, setCodigoRota] = useState("");
  const [placaVeiculo, setPlacaVeiculo] = useState("");
  const [cpfMotorista, setCpfMotorista] = useState("");

  const [dataViagem, setDataViagem] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const webDateInputRef = useRef<any>(null); // Referência para o input HTML na Web

  const [horarioSaidaPrevisto, setHorarioSaidaPrevisto] = useState("");
  const [horarioChegadaPrevisto, setHorarioChegadaPrevisto] = useState("");
  const [creating, setCreating] = useState(false);
  const [associatingCode, setAssociatingCode] = useState<string | null>(null);
  const [cancellingCode, setCancellingCode] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const canCreate = user?.role === "ADMIN" || user?.role === "MOTORISTA";
  const canAssociate = user?.role === "PASSAGEIRO" && Boolean(user.cpf);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const v = await viagensService.listar();
      setItems(Array.isArray(v) ? v : []);
    } catch (e: any) {
      setError(e?.message || "Não foi possível obter viagens.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAssociated = useCallback(async () => {
    if (!user?.cpf || user.role !== "PASSAGEIRO") return;

    setAssociatedLoading(true);
    setAssociatedError("");
    try {
      const trips = await viagensService.listarPorPassageiro(user.cpf);
      setAssociatedItems(Array.isArray(trips) ? trips : []);
    } catch (e: any) {
      setAssociatedError(
        e?.message || "Não foi possível obter suas viagens associadas.",
      );
    } finally {
      setAssociatedLoading(false);
    }
  }, [user?.cpf, user?.role]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadAssociated();
  }, [loadAssociated]);

  const associatePassenger = async (codigo: string) => {
    if (!user?.cpf || associatingCode || cancellingCode) return;

    setAssociatingCode(codigo);
    setError("");
    setMessage("");

    try {
      await viagensService.associarPassageiro(codigo, user.cpf);
      setMessage("Você foi associado à viagem com sucesso.");
      await Promise.all([load(), loadAssociated()]);
    } catch (e: any) {
      setError(e?.message || "Não foi possível associar você à viagem.");
    } finally {
      setAssociatingCode(null);
    }
  };

  const removePassenger = async (codigo: string) => {
    if (!user?.cpf || associatingCode || cancellingCode) return;

    setCancellingCode(codigo);
    setError("");
    setMessage("");

    try {
      await viagensService.removerPassageiro(codigo, user.cpf);
      setMessage("Sua associação com a viagem foi cancelada.");
      await loadAssociated();
    } catch (e: any) {
      setAssociatedError(
        e?.message || "Não foi possível cancelar sua associação.",
      );
    } finally {
      setCancellingCode(null);
    }
  };

  const confirmRemovePassenger = (codigo: string) => {
    const remove = () => {
      void removePassenger(codigo);
    };

    if (typeof window !== "undefined" && typeof window.confirm === "function") {
      if (window.confirm("Deseja cancelar sua associação com esta viagem?")) {
        remove();
      }
      return;
    }

    Alert.alert(
      "Cancelar associação",
      "Deseja cancelar sua associação com esta viagem?",
      [
        { text: "Manter", style: "cancel" },
        { text: "Cancelar associação", style: "destructive", onPress: remove },
      ],
    );
  };

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowPicker(false);
    }
    if (event.type === "set" && selectedDate) {
      setDataViagem(selectedDate);
    }
  };

  // Abre o calendário de acordo com a plataforma
  const handleOpenCalendar = () => {
    if (Platform.OS === "web") {
      // Abre o seletor nativo do navegador (Chrome, Edge, Safari, Firefox)
      if (webDateInputRef.current?.showPicker) {
        webDateInputRef.current.showPicker();
      } else {
        webDateInputRef.current?.focus();
      }
    } else {
      setShowPicker((prev) => !prev);
    }
  };

  const create = async () => {
    const textFields = [
      codigoRota,
      placaVeiculo,
      cpfMotorista,
      horarioSaidaPrevisto,
      horarioChegadaPrevisto,
    ].map((value) => value.trim());

    if (textFields.some((value) => !value) || !dataViagem) {
      setError("Preencha todos os campos para cadastrar a viagem.");
      setMessage("");
      return;
    }

    if (!isValidLocalTime(textFields[3]) || !isValidLocalTime(textFields[4])) {
      setError("Informe os horários no formato HH:mm.");
      setMessage("");
      return;
    }

    setCreating(true);
    setError("");
    setMessage("");

    try {
      await viagensService.criar({
        codigoRota: textFields[0],
        placaVeiculo: textFields[1],
        cpfMotorista: textFields[2],
        dataViagem: formatDateToAPI(dataViagem),
        horarioSaidaPrevisto: textFields[3],
        horarioChegadaPrevisto: textFields[4],
      });

      setMessage("Viagem cadastrada com sucesso.");
      setCodigoRota("");
      setPlacaVeiculo("");
      setCpfMotorista("");
      setDataViagem(null);
      setShowPicker(false);
      setHorarioSaidaPrevisto("");
      setHorarioChegadaPrevisto("");
      await load();
    } catch (e: any) {
      setError(e?.message || "Não foi possível cadastrar a viagem.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Shell
      eyebrow="OPERAÇÕES / VIAGENS"
      title="Cada viagem, organizada."
      description="Consulte viagens registradas na plataforma e acompanhe o histórico disponível."
    >
      {canCreate && (
        <>
          <SectionTitle
            title="Cadastrar viagem"
            caption="Nova saída operacional"
          />
          <Panel padding={16} style={{ gap: 12, marginBottom: 18 }}>
            <TextInput
              value={codigoRota}
              onChangeText={setCodigoRota}
              placeholder="Código da rota (ROT-...)"
              placeholderTextColor={C.faint}
              style={inputStyle}
            />
            <TextInput
              value={placaVeiculo}
              onChangeText={setPlacaVeiculo}
              placeholder="Placa do veículo"
              placeholderTextColor={C.faint}
              autoCapitalize="characters"
              style={inputStyle}
            />
            <TextInput
              value={cpfMotorista}
              onChangeText={setCpfMotorista}
              placeholder="CPF do motorista"
              placeholderTextColor={C.faint}
              keyboardType="numeric"
              style={inputStyle}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              {/* Campo unificado: funciona em Web, Android e iOS */}
              <Pressable
                onPress={handleOpenCalendar}
                style={[
                  inputStyle,
                  {
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "relative",
                  },
                ]}
              >
                <Text style={{ color: dataViagem ? C.white : C.faint }}>
                  {dataViagem
                    ? formatDateToBR(dataViagem)
                    : "Data (DD/MM/AAAA)"}
                </Text>
                <Ionicons name="calendar-outline" size={18} color={C.muted} />

                {/* Input HTML oculto usado apenas na Web para disparar o calendário nativo */}
                {Platform.OS === "web" && (
                  <input
                    ref={webDateInputRef}
                    type="date"
                    value={dataViagem ? formatDateToAPI(dataViagem) : ""}
                    onChange={(e) =>
                      setDataViagem(parseAPIDateToLocal(e.target.value))
                    }
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      width: "100%",
                      height: "100%",
                      cursor: "pointer",
                    }}
                  />
                )}
              </Pressable>

              <TextInput
                value={horarioSaidaPrevisto}
                onChangeText={(value) =>
                  setHorarioSaidaPrevisto(formatLocalTimeInput(value))
                }
                placeholder="Saída (HH:mm)"
                placeholderTextColor={C.faint}
                style={[inputStyle, { flex: 1 }]}
              />
            </View>

            {/* Calendário nativo apenas para iOS e Android */}
            {showPicker && Platform.OS !== "web" && (
              <View style={{ alignItems: "center" }}>
                <DateTimePicker
                  value={dataViagem || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "inline" : "default"}
                  themeVariant="dark"
                  onChange={onChangeDate}
                />
                {Platform.OS === "ios" && (
                  <Pressable
                    onPress={() => setShowPicker(false)}
                    style={{
                      alignSelf: "flex-end",
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text style={{ color: C.white, fontWeight: "700" }}>
                      Confirmar data
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            <TextInput
              value={horarioChegadaPrevisto}
              onChangeText={(value) =>
                setHorarioChegadaPrevisto(formatLocalTimeInput(value))
              }
              placeholder="Chegada (HH:mm)"
              placeholderTextColor={C.faint}
              style={inputStyle}
            />

            <Pressable
              disabled={creating}
              onPress={create}
              style={{
                height: 48,
                borderRadius: 12,
                backgroundColor: C.white,
                alignItems: "center",
                justifyContent: "center",
                opacity: creating ? 0.6 : 1,
              }}
            >
              <Text style={{ color: C.bg, fontWeight: "800" }}>
                {creating ? "Cadastrando..." : "Cadastrar viagem"}
              </Text>
            </Pressable>
          </Panel>
        </>
      )}

      {!!message && (
        <Text style={{ color: C.white, paddingBottom: 15 }}>{message}</Text>
      )}

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 15,
        }}
      >
        <Pill text={`${items.length} REGISTROS`} />
        <Pressable
          onPress={load}
          style={{ flexDirection: "row", gap: 8, padding: 10 }}
        >
          <Ionicons name="refresh-outline" size={17} color={C.white} />
          <Text style={{ color: C.white, fontSize: 12, fontWeight: "700" }}>
            Atualizar
          </Text>
        </Pressable>
      </View>

      <Panel>
        {loading ? (
          <ActivityIndicator
            color={C.white}
            size="large"
            style={{ marginVertical: 35 }}
          />
        ) : error ? (
          <Text style={{ color: C.muted, lineHeight: 23, paddingVertical: 15 }}>
            {error}
          </Text>
        ) : items.length ? (
          items.map((v, i) => {
            const codigo = String(v.codigoViagem || v.codigo || "");
            const isAssociating = associatingCode === codigo;

            return (
              <View
                key={codigo || i}
                style={{
                  flexDirection: "row",
                  gap: 16,
                  alignItems: "center",
                  paddingVertical: 20,
                  borderBottomWidth: i < items.length - 1 ? 1 : 0,
                  borderColor: C.line,
                }}
              >
                <View
                  style={{
                    backgroundColor: "#272727",
                    width: 45,
                    height: 45,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name="navigate-outline" color={C.white} size={20} />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Text
                    style={{ color: C.white, fontSize: 14, fontWeight: "800" }}
                  >
                    Viagem {codigo || String(i + 1).padStart(3, "0")}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 12 }}>
                    {formatISOStringToBR(v.dataViagem || v.data)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 8 }}>
                  <Pill
                    text={String(
                      v.viagemConcluida || v.viagemConcuida
                        ? "CONCLUÍDA"
                        : v.status || "CADASTRADA",
                    )}
                  />
                  {canAssociate && codigo && (
                    <Pressable
                      disabled={isAssociating}
                      onPress={() => associatePassenger(codigo)}
                      style={{
                        borderWidth: 1,
                        borderColor: C.white,
                        borderRadius: 10,
                        paddingVertical: 8,
                        paddingHorizontal: 10,
                        opacity: isAssociating ? 0.6 : 1,
                      }}
                    >
                      <Text style={{ color: C.white, fontSize: 11, fontWeight: "800" }}>
                        {isAssociating ? "Associando..." : "Associar a mim"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 13 }}>
            <Ionicons name="calendar-outline" size={31} color={C.muted} />
            <Text style={{ color: C.white, fontWeight: "800" }}>
              Nenhuma viagem encontrada.
            </Text>
            <Text style={{ color: C.muted, fontSize: 12 }}>
              Os registros aparecerão aqui quando forem cadastrados.
            </Text>
          </View>
        )}
      </Panel>

      {canAssociate && (
        <>
          <SectionTitle
            title="Minhas viagens"
            caption="Viagens associadas à sua conta"
          />
          <Panel>
            {associatedLoading ? (
              <ActivityIndicator
                color={C.white}
                size="large"
                style={{ marginVertical: 35 }}
              />
            ) : associatedError ? (
              <Text
                style={{ color: C.muted, lineHeight: 23, paddingVertical: 15 }}
              >
                {associatedError}
              </Text>
            ) : associatedItems.length ? (
              associatedItems.map((v, i) => {
                const codigo = String(v.codigoViagem || v.codigo || "");

                return (
                  <View
                    key={codigo || i}
                    style={{
                      flexDirection: "row",
                      gap: 16,
                      alignItems: "center",
                      paddingVertical: 20,
                      borderBottomWidth:
                        i < associatedItems.length - 1 ? 1 : 0,
                      borderColor: C.line,
                    }}
                  >
                    <View
                      style={{
                        backgroundColor: "#272727",
                        width: 45,
                        height: 45,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        color={C.white}
                        size={20}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Text
                        style={{
                          color: C.white,
                          fontSize: 14,
                          fontWeight: "800",
                        }}
                      >
                        Viagem {codigo || String(i + 1).padStart(3, "0")}
                      </Text>
                      <Text style={{ color: C.muted, fontSize: 12 }}>
                        {formatISOStringToBR(v.dataViagem || v.data)}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 8 }}>
                      <Pill
                        text={String(
                          v.viagemConcluida || v.viagemConcuida
                            ? "CONCLUÍDA"
                            : v.status || "ASSOCIADA",
                        )}
                      />
                      {codigo && (
                        <Pressable
                          disabled={Boolean(cancellingCode || associatingCode)}
                          onPress={() => confirmRemovePassenger(codigo)}
                          style={{
                            borderWidth: 1,
                            borderColor: "#B86A6A",
                            borderRadius: 10,
                            paddingVertical: 8,
                            paddingHorizontal: 10,
                            opacity: cancellingCode === codigo ? 0.6 : 1,
                          }}
                        >
                          <Text
                            style={{
                              color: "#E59A9A",
                              fontSize: 11,
                              fontWeight: "800",
                            }}
                          >
                            {cancellingCode === codigo
                              ? "Cancelando..."
                              : "Cancelar associação"}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View
                style={{ alignItems: "center", paddingVertical: 35, gap: 10 }}
              >
                <Ionicons
                  name="calendar-outline"
                  size={31}
                  color={C.muted}
                />
                <Text style={{ color: C.white, fontWeight: "800" }}>
                  Você ainda não está associado a nenhuma viagem.
                </Text>
                <Text style={{ color: C.muted, fontSize: 12 }}>
                  Use o botão “Associar a mim” em uma viagem disponível.
                </Text>
              </View>
            )}
          </Panel>
        </>
      )}
    </Shell>
  );
}

const inputStyle = {
  height: 46,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: C.line,
  backgroundColor: "#1B1B1B",
  color: C.white,
  paddingHorizontal: 14,
};
